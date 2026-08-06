/**
 * The canonical **routing lifecycle state machine** — the single source of truth for routing
 * statuses, the allowed transitions between them, the lifecycle actions and the lifecycle events.
 * This is REAL, deterministic routing orchestration vocabulary (not a placeholder): the transition
 * table and action predicates decide *whether* a governed transition is structurally permitted. The
 * transition itself, the venue scoring and the route selection happen in the Smart Order Router
 * service; the actual execution happens downstream in the Execution Engine — NEVER here.
 *
 * Contains NO exchange SDK, NO broker SDK, NO FIX, NO REST/WebSocket transport. Pure rules.
 */

/** The routing lifecycle statuses (9 canonical steps + a failure terminal). */
export type RoutingStatus =
  | 'EXECUTION_REQUEST'
  | 'VENUE_DISCOVERY'
  | 'VENUE_FILTERING'
  | 'POLICY_EVALUATION'
  | 'VENUE_RANKING'
  | 'ROUTE_SELECTION'
  | 'ROUTE_VALIDATION'
  | 'ROUTE_CONFIRMED'
  | 'EXECUTION_READY'
  | 'ROUTING_FAILED';

export type RoutingStatusCategory = 'INTAKE' | 'ROUTING' | 'TERMINAL';

export interface RoutingStatusDescriptor {
  readonly status: RoutingStatus;
  readonly label: string;
  readonly description: string;
  readonly category: RoutingStatusCategory;
  readonly terminal: boolean;
}

/** The canonical lifecycle in order (the happy path ends at EXECUTION_READY). */
export const ROUTING_STATUSES: readonly RoutingStatus[] = [
  'EXECUTION_REQUEST',
  'VENUE_DISCOVERY',
  'VENUE_FILTERING',
  'POLICY_EVALUATION',
  'VENUE_RANKING',
  'ROUTE_SELECTION',
  'ROUTE_VALIDATION',
  'ROUTE_CONFIRMED',
  'EXECUTION_READY',
  'ROUTING_FAILED',
];

const STATUS_DESCRIPTORS: Record<RoutingStatus, RoutingStatusDescriptor> = {
  EXECUTION_REQUEST: {
    status: 'EXECUTION_REQUEST',
    label: 'Execution request',
    description: 'A routing request was received from the Execution Engine.',
    category: 'INTAKE',
    terminal: false,
  },
  VENUE_DISCOVERY: {
    status: 'VENUE_DISCOVERY',
    label: 'Venue discovery',
    description: 'Discovering candidate venues for the instrument.',
    category: 'ROUTING',
    terminal: false,
  },
  VENUE_FILTERING: {
    status: 'VENUE_FILTERING',
    label: 'Venue filtering',
    description: 'Filtering venues by capability, status and blacklist.',
    category: 'ROUTING',
    terminal: false,
  },
  POLICY_EVALUATION: {
    status: 'POLICY_EVALUATION',
    label: 'Policy evaluation',
    description: 'Evaluating the routing policies against the candidates.',
    category: 'ROUTING',
    terminal: false,
  },
  VENUE_RANKING: {
    status: 'VENUE_RANKING',
    label: 'Venue ranking',
    description: 'Scoring and ranking the candidate venues.',
    category: 'ROUTING',
    terminal: false,
  },
  ROUTE_SELECTION: {
    status: 'ROUTE_SELECTION',
    label: 'Route selection',
    description: 'Selecting the top-ranked venue (with a fallback).',
    category: 'ROUTING',
    terminal: false,
  },
  ROUTE_VALIDATION: {
    status: 'ROUTE_VALIDATION',
    label: 'Route validation',
    description: 'Validating the selected route (capability, risk, capacity).',
    category: 'ROUTING',
    terminal: false,
  },
  ROUTE_CONFIRMED: {
    status: 'ROUTE_CONFIRMED',
    label: 'Route confirmed',
    description: 'The route is confirmed.',
    category: 'ROUTING',
    terminal: false,
  },
  EXECUTION_READY: {
    status: 'EXECUTION_READY',
    label: 'Execution ready',
    description: 'The route is ready to hand back to the Execution Engine.',
    category: 'TERMINAL',
    terminal: true,
  },
  ROUTING_FAILED: {
    status: 'ROUTING_FAILED',
    label: 'Routing failed',
    description: 'No feasible venue (all filtered/blacklisted) or validation failure.',
    category: 'TERMINAL',
    terminal: true,
  },
};

export function describeStatus(status: RoutingStatus): RoutingStatusDescriptor {
  return STATUS_DESCRIPTORS[status];
}

export function statusOrder(status: RoutingStatus): number {
  return ROUTING_STATUSES.indexOf(status);
}

export function isTerminalStatus(status: RoutingStatus): boolean {
  return STATUS_DESCRIPTORS[status].terminal;
}

export function isActiveStatus(status: RoutingStatus): boolean {
  return !isTerminalStatus(status);
}

/** Whether a failed routing may be retried (re-discovered). */
export function isRetryableStatus(status: RoutingStatus): boolean {
  return status === 'ROUTING_FAILED';
}

/**
 * The routing transition table — the allowed target statuses for each status. Every routing step can
 * fail to `ROUTING_FAILED`. `EXECUTION_READY` and `ROUTING_FAILED` can loop back to `VENUE_DISCOVERY`
 * (re-routing / retry).
 */
export const ROUTING_TRANSITIONS: Record<RoutingStatus, readonly RoutingStatus[]> = {
  EXECUTION_REQUEST: ['VENUE_DISCOVERY', 'ROUTING_FAILED'],
  VENUE_DISCOVERY: ['VENUE_FILTERING', 'ROUTING_FAILED'],
  VENUE_FILTERING: ['POLICY_EVALUATION', 'ROUTING_FAILED'],
  POLICY_EVALUATION: ['VENUE_RANKING', 'ROUTING_FAILED'],
  VENUE_RANKING: ['ROUTE_SELECTION', 'ROUTING_FAILED'],
  ROUTE_SELECTION: ['ROUTE_VALIDATION', 'ROUTING_FAILED'],
  ROUTE_VALIDATION: ['ROUTE_CONFIRMED', 'ROUTING_FAILED'],
  ROUTE_CONFIRMED: ['EXECUTION_READY', 'ROUTING_FAILED'],
  EXECUTION_READY: ['VENUE_DISCOVERY'],
  ROUTING_FAILED: ['VENUE_DISCOVERY'],
};

export function nextStatuses(status: RoutingStatus): readonly RoutingStatus[] {
  return ROUTING_TRANSITIONS[status];
}

export function canTransition(from: RoutingStatus, to: RoutingStatus): boolean {
  return ROUTING_TRANSITIONS[from].includes(to);
}

/** The primary "happy path" successor status, or null at a terminal state. */
export function happyPathNext(status: RoutingStatus): RoutingStatus | null {
  const index = ROUTING_STATUSES.indexOf(status);
  if (status === 'EXECUTION_READY' || status === 'ROUTING_FAILED') return null;
  const next = ROUTING_STATUSES[index + 1];
  return next && next !== 'ROUTING_FAILED' ? next : null;
}

/* --------------------------------- actions --------------------------------- */

/** The lifecycle actions an operator/engine may request on a routing request or venue. */
export type RoutingAction = 'reroute' | 'fallback' | 'retry' | 'blacklist' | 'recover';

export interface RoutingActionDescriptor {
  readonly action: RoutingAction;
  readonly label: string;
  readonly description: string;
  /** Whether the action targets a venue (blacklist/recover) rather than the routing request. */
  readonly venueScoped: boolean;
}

export const ROUTING_ACTIONS: readonly RoutingActionDescriptor[] = [
  {
    action: 'reroute',
    label: 'Re-route',
    description: 'Re-run routing from venue discovery.',
    venueScoped: false,
  },
  {
    action: 'fallback',
    label: 'Fallback',
    description: 'Route to the fallback venue.',
    venueScoped: false,
  },
  { action: 'retry', label: 'Retry', description: 'Retry a failed routing.', venueScoped: false },
  {
    action: 'blacklist',
    label: 'Blacklist venue',
    description: 'Exclude a venue from routing.',
    venueScoped: true,
  },
  {
    action: 'recover',
    label: 'Recover venue',
    description: 'Restore a blacklisted venue.',
    venueScoped: true,
  },
];

export function describeAction(action: RoutingAction): RoutingActionDescriptor {
  return ROUTING_ACTIONS.find((descriptor) => descriptor.action === action)!;
}

/**
 * Whether a specific action is permitted for a status. Deterministic. `reroute` re-runs a completed
 * route; `retry`/`fallback` re-run a failed one; both land on `VENUE_DISCOVERY` (a legal transition).
 * Venue actions (blacklist/recover) are always available.
 */
export function canApplyAction(status: RoutingStatus, action: RoutingAction): boolean {
  switch (action) {
    case 'reroute':
      return status === 'EXECUTION_READY';
    case 'retry':
    case 'fallback':
      return status === 'ROUTING_FAILED';
    case 'blacklist':
    case 'recover':
      return true;
  }
}

export function permittedActions(status: RoutingStatus): RoutingAction[] {
  return ROUTING_ACTIONS.map((descriptor) => descriptor.action).filter((action) =>
    canApplyAction(status, action),
  );
}

/* --------------------------------- events ---------------------------------- */

export type RoutingEventType =
  | 'REQUEST_RECEIVED'
  | 'VENUES_DISCOVERED'
  | 'VENUES_FILTERED'
  | 'POLICIES_EVALUATED'
  | 'VENUES_RANKED'
  | 'ROUTE_SELECTED'
  | 'ROUTE_VALIDATED'
  | 'ROUTE_CONFIRMED'
  | 'EXECUTION_READY'
  | 'ROUTING_FAILED'
  | 'REROUTED'
  | 'FALLBACK_ROUTED'
  | 'RETRIED'
  | 'VENUE_BLACKLISTED'
  | 'VENUE_RECOVERED';

const EVENT_LABELS: Record<RoutingEventType, string> = {
  REQUEST_RECEIVED: 'Request received',
  VENUES_DISCOVERED: 'Venues discovered',
  VENUES_FILTERED: 'Venues filtered',
  POLICIES_EVALUATED: 'Policies evaluated',
  VENUES_RANKED: 'Venues ranked',
  ROUTE_SELECTED: 'Route selected',
  ROUTE_VALIDATED: 'Route validated',
  ROUTE_CONFIRMED: 'Route confirmed',
  EXECUTION_READY: 'Execution ready',
  ROUTING_FAILED: 'Routing failed',
  REROUTED: 'Re-routed',
  FALLBACK_ROUTED: 'Fallback routed',
  RETRIED: 'Retried',
  VENUE_BLACKLISTED: 'Venue blacklisted',
  VENUE_RECOVERED: 'Venue recovered',
};

export function describeEvent(type: RoutingEventType): {
  readonly type: RoutingEventType;
  readonly label: string;
} {
  return { type, label: EVENT_LABELS[type] };
}
