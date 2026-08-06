/**
 * Smart-order-router application service — the orchestration surface of the canonical Smart Order
 * Router. It receives routing requests from the Execution Engine and determines the optimal venue via
 * the REAL routing pipeline (discover → filter → policy evaluation → rank → select → validate →
 * confirm → execution ready, or failed) under the routing policy framework and the venue ranking
 * framework. It runs the routing lifecycle, applies actions (reroute / retry / fallback / blacklist /
 * recover), manages the venue registry, and serves the decisions/timeline/audit/history/replay/
 * metrics/health/policies views. It integrates with the Execution Engine, Order Management System,
 * Connector Management, Live Trading Platform, Risk Engine, Monitoring Module, Configuration
 * Foundation, Validation Foundation, Workflow Engine, Audit Center and Notification Center through
 * ports ONLY.
 *
 * It holds no exchange/broker SDK, no API keys, no HTTP/WebSocket/FIX, and no connectivity. All
 * lifecycle transitions are enforced by the state machine; the venue is an abstraction and execution
 * happens downstream.
 */
import {
  ROUTING_POLICY_CATALOG,
  VENUE_TYPES,
  isActiveStatus,
  isTerminalStatus,
  type RankedVenue,
  type Routing,
  type RoutingAction,
  type RoutingDecision,
  type RoutingEvent,
  type RoutingHistory,
  type RoutingPolicyDescriptor,
  type RoutingRequest,
  type Venue,
  type VenueTypeDescriptor,
} from '@platform/sor-sdk';
import { applyAction, createRouting, runRouting, type LifecycleResult } from '../domain/lifecycle';
import { routeRequest, type RoutingComputation } from '../domain/routing';
import { applyRoutingSearch, type RoutingScope, type RoutingSearch } from '../domain/search';
import { computeRoutingMetrics } from '../domain/metrics';
import { computeHealth, type RoutingHealth } from '../domain/health';
import { replayRouting, type ReplayResult } from '../domain/replay';
import { venueHealth, venueLatency } from '../domain/venues';
import type {
  AuditPort,
  ConfigurationPort,
  EventBusPort,
  ExecutionEnginePort,
  NotificationPort,
  RiskPort,
  RoutingStorePort,
  VenueStorePort,
  WorkflowPort,
} from '../infrastructure/ports';

export type OperationResult =
  | { readonly ok: true; readonly routing: Routing }
  | { readonly ok: false; readonly reason: string };

export interface RoutePreview {
  readonly decision: RoutingDecision;
  readonly ranked: readonly RankedVenue[];
  readonly excluded: readonly { readonly venueId: string; readonly reason: string }[];
  readonly candidateVenueIds: readonly string[];
  readonly feasibleCount: number;
  readonly ok: boolean;
}

export interface ExecutionEngineServiceDeps {
  readonly store: RoutingStorePort;
  readonly venues: VenueStorePort;
  readonly execution: ExecutionEnginePort;
  readonly risk: RiskPort;
  readonly workflow: WorkflowPort;
  readonly audit: AuditPort;
  readonly notifications: NotificationPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class SmartOrderRouterService {
  constructor(private readonly deps: ExecutionEngineServiceDeps) {}

  /* ------------------------------ read models ------------------------------ */

  listRoutings(): Promise<readonly Routing[]> {
    return this.deps.store.list();
  }
  async searchRoutings(query: RoutingSearch = {}): Promise<readonly Routing[]> {
    return applyRoutingSearch(await this.deps.store.list(), query);
  }
  getRouting(id: string): Promise<Routing | null> {
    return this.deps.store.getById(id);
  }
  private async scope(scope: RoutingScope): Promise<readonly Routing[]> {
    return (await this.deps.store.list()).filter((routing) =>
      scope === 'ALL'
        ? true
        : scope === 'ACTIVE'
          ? isActiveStatus(routing.status)
          : scope === 'READY'
            ? routing.status === 'EXECUTION_READY'
            : scope === 'FAILED'
              ? routing.status === 'ROUTING_FAILED'
              : isTerminalStatus(routing.status),
    );
  }
  activeRoutings(): Promise<readonly Routing[]> {
    return this.scope('ACTIVE');
  }
  readyRoutings(): Promise<readonly Routing[]> {
    return this.scope('READY');
  }
  failedRoutings(): Promise<readonly Routing[]> {
    return this.scope('FAILED');
  }

  listVenues(): Promise<readonly Venue[]> {
    return this.deps.venues.list();
  }
  getVenue(id: string): Promise<Venue | null> {
    return this.deps.venues.getById(id);
  }
  async venueHealthList(at: string) {
    return (await this.deps.venues.list()).map((venue) => venueHealth(venue, at));
  }
  async venueLatencyList() {
    return (await this.deps.venues.list()).map(venueLatency);
  }

  listPolicies(): readonly RoutingPolicyDescriptor[] {
    return ROUTING_POLICY_CATALOG;
  }
  listVenueTypes(): readonly VenueTypeDescriptor[] {
    return VENUE_TYPES;
  }

  async metrics() {
    return computeRoutingMetrics(await this.deps.store.list());
  }
  async health(at: string): Promise<RoutingHealth> {
    return computeHealth(await this.deps.store.list(), await this.deps.venues.list(), at);
  }

  async routingTimeline(id: string): Promise<readonly RoutingEvent[]> {
    const routing = await this.deps.store.getById(id);
    return routing ? routing.events : [];
  }
  async routingAudit(id: string): Promise<Routing['audit']> {
    const routing = await this.deps.store.getById(id);
    return routing ? routing.audit : [];
  }
  async routingHistory(id: string): Promise<RoutingHistory | null> {
    const routing = await this.deps.store.getById(id);
    return routing
      ? { routingId: routing.id, states: routing.states, events: routing.events }
      : null;
  }
  async replay(id: string): Promise<ReplayResult | null> {
    const routing = await this.deps.store.getById(id);
    return routing ? replayRouting(routing) : null;
  }
  async routingDecision(id: string): Promise<RoutingDecision | null> {
    const routing = await this.deps.store.getById(id);
    return routing?.decision ?? null;
  }

  /* ------------------------------ orchestration ---------------------------- */

  /** Preview a routing decision without persisting (the Routing Rules / Decisions screen). */
  async previewRoute(request: RoutingRequest, at: string): Promise<RoutePreview> {
    const venues = await this.deps.venues.list();
    const blacklisted = await this.deps.venues.blacklisted();
    const computation: RoutingComputation = routeRequest(request, venues, blacklisted, at);
    return {
      decision: computation.decision,
      ranked: computation.ranked,
      excluded: computation.excluded,
      candidateVenueIds: computation.candidateVenueIds,
      feasibleCount: computation.feasible.length,
      ok: computation.ok,
    };
  }

  /** Receive a routing request from the Execution Engine: create → run pipeline → persist. */
  async submitRoutingRequest(request: RoutingRequest, at: string): Promise<Routing> {
    const venues = await this.deps.venues.list();
    const created = createRouting(request, at);
    const result = runRouting(created, venues, at);
    const routing = result.ok ? result.routing : created;
    await this.deps.store.save(routing);
    await this.deps.workflow.scheduleRouting(routing.id);
    if (routing.status === 'EXECUTION_READY' && routing.decision?.selectedVenueId) {
      await this.deps.execution.handOff(routing.executionId, routing.decision.selectedVenueId);
    } else if (routing.status === 'ROUTING_FAILED') {
      await this.deps.notifications.notify({
        routingId: routing.id,
        channel: 'trading-ops',
        summary: `Routing failed for ${routing.clientOrderId}.`,
      });
    }
    await this.publish(routing, 'ROUTING_SUBMITTED');
    return routing;
  }

  /** Apply a lifecycle action; reroute/retry/fallback re-run the pipeline; blacklist/recover mutate the registry. */
  async applyAction(
    id: string,
    action: RoutingAction,
    actor: string,
    at: string,
    targetVenueId?: string,
  ): Promise<OperationResult> {
    const routing = await this.deps.store.getById(id);
    if (!routing) return { ok: false, reason: `unknown routing ${id}` };
    const applied = applyAction(routing, action, actor, at, targetVenueId);
    if (!applied.ok) return { ok: false, reason: applied.reason };
    let next = applied.routing;

    if (action === 'blacklist' && targetVenueId) await this.deps.venues.blacklist(targetVenueId);
    if (action === 'recover' && targetVenueId) await this.deps.venues.recover(targetVenueId);

    if (action === 'reroute' || action === 'retry' || action === 'fallback') {
      const venues = await this.deps.venues.list();
      const rerun = runRouting(next, venues, at);
      if (rerun.ok) next = rerun.routing;
      if (next.status === 'EXECUTION_READY' && next.decision?.selectedVenueId)
        await this.deps.execution.handOff(next.executionId, next.decision.selectedVenueId);
    }

    await this.deps.store.save(next);
    const last = next.events[next.events.length - 1];
    await this.deps.audit.record({
      routingId: next.id,
      actor: last?.actor ?? actor,
      action: last?.type ?? action.toUpperCase(),
      at: last?.at ?? next.updatedAt,
    });
    await this.publish(next, action.toUpperCase());
    return { ok: true, routing: next };
  }

  /** Blacklist a venue in the registry (Venue Health action). */
  async blacklistVenue(venueId: string): Promise<void> {
    await this.deps.venues.blacklist(venueId);
  }
  /** Recover a blacklisted venue in the registry. */
  async recoverVenue(venueId: string): Promise<void> {
    await this.deps.venues.recover(venueId);
  }

  private async publish(routing: Routing, type: string): Promise<void> {
    await this.deps.bus.publish({
      id: `${routing.id}:${type}:${routing.updatedAt}`,
      routingId: routing.id,
      type,
      message: `${routing.clientOrderId} ${type} (${routing.status}).`,
      occurredAt: routing.updatedAt,
    });
  }
}

/** A small summary derived from a set of routings (for the dashboard header). */
export function summarize(routings: readonly Routing[]) {
  return {
    total: routings.length,
    active: routings.filter((r) => isActiveStatus(r.status)).length,
    ready: routings.filter((r) => r.status === 'EXECUTION_READY').length,
    failed: routings.filter((r) => r.status === 'ROUTING_FAILED').length,
    terminal: routings.filter((r) => isTerminalStatus(r.status)).length,
  };
}

// Keep a stable type alias for the lifecycle result (re-exported for callers).
export type { LifecycleResult };
