/**
 * SOR application service — the ONLY layer the UI/hooks call. Orchestrates the repository and maps
 * canonical routings/venues to view models, including cross-routing aggregate views (timeline, audit,
 * decisions, metrics, health) and the route preview. No infrastructure, no exchange/broker SDK, no
 * connectivity, no persistence. The routing/ranking logic lives in the SDK / SOR service.
 */
import { type RoutingPolicy, type RoutingRequest } from '@platform/sor-sdk';
import {
  computeHealth,
  computeMetrics,
  policyCatalogVms,
  replay,
  toDecisionRowVm,
  toDetailVm,
  toHealthVm,
  toMetricsVm,
  toReplayVm,
  toRoutePreviewVm,
  toRowVm,
  toSummaryVm,
  toVenueHealthVm,
  toVenueVm,
  statusVm,
  venueTypeVms,
} from '../domain/mappers';
import type { RoutingQuery } from '../domain/query';
import { previewRoute } from '../data/rules';
import type {
  AuditRowVm,
  DecisionRowVm,
  HealthVm,
  MetricsVm,
  PolicyDescriptorVm,
  ReplayVm,
  RoutePreviewVm,
  RoutingDetailVm,
  RoutingRowVm,
  SorSummaryVm,
  StatusVm,
  TimelineRowVm,
  VenueHealthVm,
  VenueTypeVm,
  VenueVm,
} from '../domain/view-model';
import type { SorRepository } from '../data/repository';

export interface PreviewInput {
  readonly symbol: string;
  readonly quantity: number;
  readonly assetClass: string;
  readonly mode: 'SIMULATED' | 'PAPER' | 'LIVE';
  readonly policyType: RoutingPolicy['type'];
  readonly preferredVenueId?: string;
}
export interface RoutingRefVm {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly status: StatusVm;
}

const AT = '2026-08-01T15:30:00.000Z';

export class SorAdminService {
  constructor(private readonly repository: SorRepository) {}

  async listRoutings(query: RoutingQuery = {}): Promise<RoutingRowVm[]> {
    return (await this.repository.listRoutings(query)).map(toRowVm);
  }
  async getRouting(id: string): Promise<RoutingDetailVm | null> {
    const routing = await this.repository.getRouting(id);
    return routing ? toDetailVm(routing) : null;
  }
  async getSummary(): Promise<SorSummaryVm> {
    return toSummaryVm(await this.repository.listAll(), await this.repository.listVenues());
  }
  async getMetrics(): Promise<MetricsVm> {
    return toMetricsVm(computeMetrics(await this.repository.listAll()));
  }
  async getHealth(): Promise<HealthVm> {
    return toHealthVm(
      computeHealth(await this.repository.listAll(), await this.repository.listVenues()),
    );
  }
  async getTimeline(): Promise<TimelineRowVm[]> {
    const routings = await this.repository.listAll();
    return routings
      .flatMap((routing) => routing.events.map((event) => ({ event, routing })))
      .sort((a, b) => b.event.at.localeCompare(a.event.at))
      .map(({ event, routing }) => ({
        id: event.id,
        type: event.type.replace(/_/g, ' '),
        status: event.status ? statusVm(event.status) : undefined,
        message: event.message,
        actor: event.actor,
        atLabel: event.at.slice(0, 16).replace('T', ' '),
        tone:
          event.type === 'ROUTING_FAILED'
            ? 'danger'
            : event.type === 'EXECUTION_READY'
              ? 'positive'
              : 'info',
        routingId: routing.id,
        clientOrderId: routing.clientOrderId,
        symbol: routing.symbol,
      }));
  }
  async getAudit(): Promise<AuditRowVm[]> {
    const routings = await this.repository.listAll();
    return routings
      .flatMap((routing) => routing.audit.map((entry) => ({ entry, routing })))
      .sort((a, b) => b.entry.at.localeCompare(a.entry.at))
      .map(({ entry, routing }) => ({
        id: entry.id,
        actor: entry.actor,
        action: entry.action.replace(/_/g, ' '),
        detail: entry.detail,
        atLabel: entry.at.slice(0, 16).replace('T', ' '),
        routingId: routing.id,
        clientOrderId: routing.clientOrderId,
      }));
  }
  async getDecisions(): Promise<DecisionRowVm[]> {
    return (await this.repository.listAll())
      .filter((routing) => routing.decision)
      .map(toDecisionRowVm);
  }
  async getReplay(id: string): Promise<ReplayVm | null> {
    const routing = await this.repository.getRouting(id);
    return routing ? toReplayVm(routing, replay(routing)) : null;
  }
  async listRefs(): Promise<RoutingRefVm[]> {
    return (await this.repository.listAll()).map((routing) => ({
      id: routing.id,
      clientOrderId: routing.clientOrderId,
      symbol: routing.symbol,
      status: statusVm(routing.status),
    }));
  }
  async listVenues(): Promise<VenueVm[]> {
    return (await this.repository.listVenues()).map(toVenueVm);
  }
  async listVenueHealth(): Promise<VenueHealthVm[]> {
    return (await this.repository.listVenues()).map(toVenueHealthVm);
  }
  listPolicies(): PolicyDescriptorVm[] {
    return policyCatalogVms();
  }
  listVenueTypes(): VenueTypeVm[] {
    return venueTypeVms();
  }

  async previewRoute(input: PreviewInput): Promise<RoutePreviewVm> {
    const venues = await this.repository.listVenues();
    const policies: RoutingPolicy[] = [
      { type: input.policyType, enabled: true, preferredVenueId: input.preferredVenueId },
    ];
    const request: RoutingRequest = {
      id: 'PREVIEW',
      executionId: 'PREVIEW',
      orderId: 'PREVIEW',
      clientOrderId: 'PREVIEW',
      symbol: input.symbol,
      side: 'BUY',
      quantity: input.quantity,
      assetClass: input.assetClass,
      mode: input.mode,
      policies,
      preferredVenueId: input.preferredVenueId,
      requestedBy: 'operator',
      requestedAt: AT,
      metadata: {
        source: 'preview',
        executionId: 'PREVIEW',
        orderId: 'PREVIEW',
        clientOrderId: 'PREVIEW',
        tags: [],
        entries: [],
      },
    };
    return toRoutePreviewVm(previewRoute(request, venues, [], AT));
  }
}
