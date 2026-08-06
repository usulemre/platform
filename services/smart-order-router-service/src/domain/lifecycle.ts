/**
 * The REAL routing lifecycle application logic — deterministic, immutable, no IO. It creates a
 * routing aggregate from a request, RUNS the routing pipeline (discover → filter → evaluate → rank →
 * select → validate → confirm → ready, or failed), and applies actions (reroute / retry / fallback /
 * blacklist / recover), enforcing the `@platform/sor-sdk` state-machine transition table and
 * appending a lifecycle event, state-history entry and audit record on every step.
 *
 * It does NOT contact any exchange/broker, speak FIX, or open a socket — the venue is an abstraction
 * and the execution happens downstream in the Execution Engine.
 */
import {
  canApplyAction,
  canTransition,
  describeVenue,
  type Routing,
  type RoutingAction,
  type RoutingEvent,
  type RoutingEventType,
  type RoutingRequest,
  type RoutingState,
  type RoutingStatus,
  type RoutingValidation,
  type ValidationCheck,
  type Venue,
} from '@platform/sor-sdk';
import { routeRequest, type RoutingComputation } from './routing';

export type LifecycleResult =
  | { readonly ok: true; readonly routing: Routing }
  | { readonly ok: false; readonly routing: Routing; readonly reason: string };

function evt(
  routing: Routing,
  type: RoutingEventType,
  message: string,
  actor: string,
  at: string,
  status?: RoutingStatus,
  action?: RoutingAction,
): RoutingEvent {
  return {
    id: `${routing.id}:EVT:${(routing.events.length + 1).toString().padStart(3, '0')}`,
    type,
    status,
    action,
    message,
    actor,
    at,
  };
}
function audit(routing: Routing, actor: string, action: string, detail: string, at: string) {
  return {
    id: `${routing.id}:AUD:${(routing.audit.length + 1).toString().padStart(3, '0')}`,
    actor,
    action,
    detail,
    at,
  };
}

/** Build an EXECUTION_REQUEST routing from a request (initial event/state/audit). */
export function createRouting(request: RoutingRequest, at: string): Routing {
  const base: Routing = {
    id: request.id.replace(/^RTR-/, 'ROU-'),
    requestId: request.id,
    executionId: request.executionId,
    orderId: request.orderId,
    clientOrderId: request.clientOrderId,
    symbol: request.symbol,
    side: request.side,
    quantity: request.quantity,
    assetClass: request.assetClass,
    mode: request.mode,
    status: 'EXECUTION_REQUEST',
    policies: request.policies,
    preferredVenueId: request.preferredVenueId,
    candidateVenueIds: [],
    blacklistedVenueIds: [],
    decision: undefined,
    validation: { status: 'NOT_RUN', checks: [] },
    attempts: 0,
    events: [],
    states: [],
    audit: [],
    metadata: request.metadata,
    tags: request.metadata.tags,
    owner: { owner: request.requestedBy, team: 'Execution', desk: 'Systematic' },
    createdAt: at,
    updatedAt: at,
  };
  return {
    ...base,
    events: [
      evt(
        base,
        'REQUEST_RECEIVED',
        `Routing request received for ${base.quantity} ${base.symbol} (${base.assetClass}).`,
        request.requestedBy,
        at,
        'EXECUTION_REQUEST',
      ),
    ],
    states: [
      {
        status: 'EXECUTION_REQUEST',
        at,
        note: 'Routing request received from the Execution Engine.',
      },
    ],
    audit: [
      audit(
        base,
        request.requestedBy,
        'REQUEST_RECEIVED',
        `Routing request received (${base.side} ${base.quantity} ${base.symbol}).`,
        at,
      ),
    ],
  };
}

interface TransitionInput {
  readonly to: RoutingStatus;
  readonly type: RoutingEventType;
  readonly actor: string;
  readonly at: string;
  readonly message: string;
  readonly patch?: Partial<Routing>;
}

export function transitionRouting(routing: Routing, input: TransitionInput): LifecycleResult {
  if (!canTransition(routing.status, input.to)) {
    return { ok: false, routing, reason: `illegal transition ${routing.status} → ${input.to}` };
  }
  return {
    ok: true,
    routing: {
      ...routing,
      ...input.patch,
      status: input.to,
      updatedAt: input.at,
      events: [
        ...routing.events,
        evt(routing, input.type, input.message, input.actor, input.at, input.to),
      ],
      states: [...routing.states, { status: input.to, at: input.at, note: input.message }],
      audit: [...routing.audit, audit(routing, input.actor, input.type, input.message, input.at)],
    },
  };
}

/** Reconstruct a routing request from a routing aggregate (for re-running the pipeline). */
export function toRequest(routing: Routing): RoutingRequest {
  return {
    id: routing.requestId,
    executionId: routing.executionId,
    orderId: routing.orderId,
    clientOrderId: routing.clientOrderId,
    symbol: routing.symbol,
    side: routing.side,
    quantity: routing.quantity,
    assetClass: routing.assetClass,
    mode: routing.mode,
    policies: routing.policies,
    preferredVenueId: routing.preferredVenueId,
    requestedBy: routing.owner.owner,
    requestedAt: routing.createdAt,
    metadata: routing.metadata,
  };
}

/** Validate a computed route (selected venue exists, feasible, capability match). */
export function validateRoute(
  computation: RoutingComputation,
  request: RoutingRequest,
  at: string,
): RoutingValidation {
  const selectedId = computation.decision.selectedVenueId;
  const venue: Venue | undefined = selectedId ? describeVenue(selectedId) : undefined;
  const checks: ValidationCheck[] = [
    {
      id: 'selected',
      label: 'A venue was selected',
      passed: selectedId !== undefined,
      detail: selectedId ?? '(none)',
    },
    {
      id: 'feasible',
      label: 'The selected venue is feasible',
      passed: computation.feasible.some((v) => v.id === selectedId),
      detail: `${computation.feasible.length} feasible`,
    },
    {
      id: 'capability',
      label: 'The venue supports the asset class',
      passed: venue ? venue.capability.assetClasses.includes(request.assetClass) : false,
      detail: request.assetClass,
    },
    {
      id: 'fallback',
      label: 'A fallback venue is available',
      passed:
        computation.decision.fallbackVenueId !== undefined || computation.feasible.length === 1,
      detail:
        computation.decision.fallbackVenueId ??
        (computation.feasible.length === 1 ? 'single feasible venue' : 'none'),
    },
  ];
  return { status: checks.every((c) => c.passed) ? 'PASSED' : 'FAILED', checks, validatedAt: at };
}

function step(
  routing: Routing,
  to: RoutingStatus,
  type: RoutingEventType,
  message: string,
  actor: string,
  at: string,
  patch?: Partial<Routing>,
): Routing {
  const result = transitionRouting(routing, { to, type, actor, at, message, patch });
  if (!result.ok) throw new Error(result.reason);
  return result.routing;
}

/**
 * Run the routing pipeline over the current routing (at EXECUTION_REQUEST or VENUE_DISCOVERY),
 * advancing it deterministically to EXECUTION_READY or ROUTING_FAILED and attaching the decision and
 * validation. Uses the injected venue set.
 */
export function runRouting(
  routing: Routing,
  venues: readonly Venue[],
  at: string,
): LifecycleResult {
  if (routing.status !== 'EXECUTION_REQUEST' && routing.status !== 'VENUE_DISCOVERY') {
    return { ok: false, routing, reason: `cannot run routing from status ${routing.status}` };
  }
  const request = toRequest(routing);
  const computation = routeRequest(request, venues, routing.blacklistedVenueIds, at);
  const actor = 'sor-router';

  try {
    let cur = routing;
    if (cur.status === 'EXECUTION_REQUEST')
      cur = step(
        cur,
        'VENUE_DISCOVERY',
        'VENUES_DISCOVERED',
        `Discovered ${computation.candidateVenueIds.length} candidate venue(s).`,
        actor,
        at,
        { candidateVenueIds: computation.candidateVenueIds },
      );
    cur = step(
      cur,
      'VENUE_FILTERING',
      'VENUES_FILTERED',
      `${computation.feasible.length} feasible, ${computation.excluded.length} excluded.`,
      actor,
      at,
      { candidateVenueIds: computation.candidateVenueIds },
    );

    if (!computation.ok) {
      const validation: RoutingValidation = {
        status: 'FAILED',
        checks: [
          {
            id: 'feasible',
            label: 'A feasible venue exists',
            passed: false,
            detail: computation.decision.reason,
          },
        ],
        validatedAt: at,
      };
      return {
        ok: true,
        routing: step(
          cur,
          'ROUTING_FAILED',
          'ROUTING_FAILED',
          computation.decision.reason,
          actor,
          at,
          { decision: computation.decision, validation },
        ),
      };
    }

    cur = step(
      cur,
      'POLICY_EVALUATION',
      'POLICIES_EVALUATED',
      `${computation.evaluations.length} policies evaluated.`,
      actor,
      at,
    );
    cur = step(
      cur,
      'VENUE_RANKING',
      'VENUES_RANKED',
      `Ranked ${computation.ranked.length} venue(s).`,
      actor,
      at,
    );
    cur = step(cur, 'ROUTE_SELECTION', 'ROUTE_SELECTED', computation.decision.reason, actor, at, {
      decision: computation.decision,
    });

    const validation = validateRoute(computation, request, at);
    if (validation.status !== 'PASSED') {
      return {
        ok: true,
        routing: step(
          cur,
          'ROUTING_FAILED',
          'ROUTING_FAILED',
          'Route validation failed.',
          actor,
          at,
          { validation },
        ),
      };
    }
    cur = step(cur, 'ROUTE_VALIDATION', 'ROUTE_VALIDATED', 'Route validated.', actor, at, {
      validation,
    });
    cur = step(
      cur,
      'ROUTE_CONFIRMED',
      'ROUTE_CONFIRMED',
      `Route confirmed: ${computation.decision.selectedVenueName}.`,
      actor,
      at,
    );
    cur = step(
      cur,
      'EXECUTION_READY',
      'EXECUTION_READY',
      `Execution ready on ${computation.decision.selectedVenueName}.`,
      actor,
      at,
    );
    return { ok: true, routing: cur };
  } catch (error) {
    return { ok: false, routing, reason: error instanceof Error ? error.message : String(error) };
  }
}

/** Apply a lifecycle action (reroute / retry / fallback / blacklist / recover). */
export function applyAction(
  routing: Routing,
  action: RoutingAction,
  actor: string,
  at: string,
  targetVenueId?: string,
): LifecycleResult {
  if (!canApplyAction(routing.status, action)) {
    return {
      ok: false,
      routing,
      reason: `action '${action}' not permitted in status ${routing.status}`,
    };
  }
  switch (action) {
    case 'reroute':
      return transitionRouting(routing, {
        to: 'VENUE_DISCOVERY',
        type: 'REROUTED',
        actor,
        at,
        message: 'Re-routing from venue discovery.',
        patch: {
          attempts: routing.attempts + 1,
          decision: undefined,
          validation: { status: 'NOT_RUN', checks: [] },
        },
      });
    case 'retry':
      return transitionRouting(routing, {
        to: 'VENUE_DISCOVERY',
        type: 'RETRIED',
        actor,
        at,
        message: `Retry routing (attempt ${routing.attempts + 1}).`,
        patch: { attempts: routing.attempts + 1 },
      });
    case 'fallback':
      return transitionRouting(routing, {
        to: 'VENUE_DISCOVERY',
        type: 'FALLBACK_ROUTED',
        actor,
        at,
        message: 'Fallback routing to alternative venues.',
        patch: { attempts: routing.attempts + 1 },
      });
    case 'blacklist': {
      if (!targetVenueId)
        return { ok: false, routing, reason: 'blacklist requires a target venue' };
      return {
        ok: true,
        routing: withVenueEvent(
          routing,
          'VENUE_BLACKLISTED',
          `Venue ${targetVenueId} blacklisted.`,
          actor,
          at,
          [...new Set([...routing.blacklistedVenueIds, targetVenueId])],
        ),
      };
    }
    case 'recover': {
      if (!targetVenueId) return { ok: false, routing, reason: 'recover requires a target venue' };
      return {
        ok: true,
        routing: withVenueEvent(
          routing,
          'VENUE_RECOVERED',
          `Venue ${targetVenueId} recovered.`,
          actor,
          at,
          routing.blacklistedVenueIds.filter((id) => id !== targetVenueId),
        ),
      };
    }
  }
}

function withVenueEvent(
  routing: Routing,
  type: RoutingEventType,
  message: string,
  actor: string,
  at: string,
  blacklistedVenueIds: readonly string[],
): Routing {
  return {
    ...routing,
    blacklistedVenueIds,
    updatedAt: at,
    events: [
      ...routing.events,
      evt(
        routing,
        type,
        message,
        actor,
        at,
        routing.status,
        type === 'VENUE_BLACKLISTED' ? 'blacklist' : 'recover',
      ),
    ],
    states: [...routing.states, { status: routing.status, at, note: message }],
    audit: [...routing.audit, audit(routing, actor, type, message, at)],
  };
}

export type { RoutingState };
