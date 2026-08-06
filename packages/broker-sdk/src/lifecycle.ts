/**
 * The canonical **broker lifecycle state machine** — the single source of truth for broker statuses,
 * the allowed transitions between them, the lifecycle actions and the lifecycle events. This is REAL,
 * deterministic gateway orchestration vocabulary (not a placeholder): the transition table and action
 * predicates decide *whether* a governed transition is structurally permitted. The transition itself
 * is applied by the broker-gateway service; the actual connectivity to a venue happens in a provider
 * adapter behind a capability contract — NEVER here.
 *
 * Contains NO exchange SDK, NO broker SDK, NO FIX, NO REST/WebSocket transport. Pure rules.
 */

/** The broker lifecycle statuses (8 canonical steps). */
export type BrokerStatus =
  | 'REGISTERED'
  | 'CONFIGURED'
  | 'AUTHENTICATED'
  | 'CONNECTED'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'ARCHIVED';

export type BrokerStatusCategory = 'PROVISIONING' | 'ACTIVE' | 'INACTIVE' | 'TERMINAL';

export interface BrokerStatusDescriptor {
  readonly status: BrokerStatus;
  readonly label: string;
  readonly description: string;
  readonly category: BrokerStatusCategory;
  readonly terminal: boolean;
}

/** The canonical lifecycle in order (provisioning → active → inactive → terminal). */
export const BROKER_STATUSES: readonly BrokerStatus[] = [
  'REGISTERED',
  'CONFIGURED',
  'AUTHENTICATED',
  'CONNECTED',
  'HEALTHY',
  'DEGRADED',
  'DISCONNECTED',
  'ARCHIVED',
];

const STATUS_DESCRIPTORS: Record<BrokerStatus, BrokerStatusDescriptor> = {
  REGISTERED: {
    status: 'REGISTERED',
    label: 'Registered',
    description: 'The broker is registered in the gateway registry, without configuration.',
    category: 'PROVISIONING',
    terminal: false,
  },
  CONFIGURED: {
    status: 'CONFIGURED',
    label: 'Configured',
    description:
      'Connection configuration (endpoints, capabilities, credentials by reference) is bound.',
    category: 'PROVISIONING',
    terminal: false,
  },
  AUTHENTICATED: {
    status: 'AUTHENTICATED',
    label: 'Authenticated',
    description:
      'The provider credentials were validated (by reference) and a session is available.',
    category: 'PROVISIONING',
    terminal: false,
  },
  CONNECTED: {
    status: 'CONNECTED',
    label: 'Connected',
    description: 'A transport session is established through the provider adapter.',
    category: 'ACTIVE',
    terminal: false,
  },
  HEALTHY: {
    status: 'HEALTHY',
    label: 'Healthy',
    description: 'Heartbeats and health checks are within tolerance.',
    category: 'ACTIVE',
    terminal: false,
  },
  DEGRADED: {
    status: 'DEGRADED',
    label: 'Degraded',
    description: 'Heartbeat latency or error rate breached a threshold; still connected.',
    category: 'ACTIVE',
    terminal: false,
  },
  DISCONNECTED: {
    status: 'DISCONNECTED',
    label: 'Disconnected',
    description: 'The transport session was lost or torn down; eligible for reconnect or failover.',
    category: 'INACTIVE',
    terminal: false,
  },
  ARCHIVED: {
    status: 'ARCHIVED',
    label: 'Archived',
    description: 'The broker is retired from the gateway; immutable history is retained.',
    category: 'TERMINAL',
    terminal: true,
  },
};

export function describeStatus(status: BrokerStatus): BrokerStatusDescriptor {
  return STATUS_DESCRIPTORS[status];
}

export function statusOrder(status: BrokerStatus): number {
  return BROKER_STATUSES.indexOf(status);
}

export function isTerminalStatus(status: BrokerStatus): boolean {
  return STATUS_DESCRIPTORS[status].terminal;
}

export function isActiveStatus(status: BrokerStatus): boolean {
  return status === 'CONNECTED' || status === 'HEALTHY' || status === 'DEGRADED';
}

/** Whether the broker is currently able to accept capability operations (connected + not degraded-out). */
export function isOperationalStatus(status: BrokerStatus): boolean {
  return status === 'CONNECTED' || status === 'HEALTHY' || status === 'DEGRADED';
}

/**
 * The broker transition table — the allowed target statuses for each status. The happy path advances
 * REGISTERED → CONFIGURED → AUTHENTICATED → CONNECTED → HEALTHY. HEALTHY ↔ DEGRADED (health check),
 * any active state can drop to DISCONNECTED, DISCONNECTED can reconnect to AUTHENTICATED/CONNECTED,
 * and most states can be ARCHIVED. ARCHIVED is terminal.
 */
export const BROKER_TRANSITIONS: Record<BrokerStatus, readonly BrokerStatus[]> = {
  REGISTERED: ['CONFIGURED', 'ARCHIVED'],
  CONFIGURED: ['AUTHENTICATED', 'ARCHIVED'],
  AUTHENTICATED: ['CONNECTED', 'DISCONNECTED', 'ARCHIVED'],
  CONNECTED: ['HEALTHY', 'DEGRADED', 'DISCONNECTED'],
  HEALTHY: ['DEGRADED', 'DISCONNECTED'],
  DEGRADED: ['HEALTHY', 'DISCONNECTED'],
  DISCONNECTED: ['AUTHENTICATED', 'CONNECTED', 'ARCHIVED'],
  ARCHIVED: [],
};

export function nextStatuses(status: BrokerStatus): readonly BrokerStatus[] {
  return BROKER_TRANSITIONS[status];
}

export function canTransition(from: BrokerStatus, to: BrokerStatus): boolean {
  return BROKER_TRANSITIONS[from].includes(to);
}

/** The primary "happy path" successor status, or null at a terminal / branch state. */
export function happyPathNext(status: BrokerStatus): BrokerStatus | null {
  switch (status) {
    case 'REGISTERED':
      return 'CONFIGURED';
    case 'CONFIGURED':
      return 'AUTHENTICATED';
    case 'AUTHENTICATED':
      return 'CONNECTED';
    case 'CONNECTED':
      return 'HEALTHY';
    default:
      return null;
  }
}

/* --------------------------------- actions --------------------------------- */

/** The lifecycle actions an operator/engine may request on a broker. */
export type BrokerAction = 'reconnect' | 'failover' | 'health_check' | 'heartbeat' | 'recovery';

export interface BrokerActionDescriptor {
  readonly action: BrokerAction;
  readonly label: string;
  readonly description: string;
}

export const BROKER_ACTIONS: readonly BrokerActionDescriptor[] = [
  {
    action: 'reconnect',
    label: 'Reconnect',
    description: 'Re-establish the transport session for a disconnected broker.',
  },
  {
    action: 'failover',
    label: 'Failover',
    description: 'Hand active traffic to a backup broker and disconnect this one.',
  },
  {
    action: 'health_check',
    label: 'Health check',
    description: 'Re-evaluate broker health (may move HEALTHY ↔ DEGRADED).',
  },
  {
    action: 'heartbeat',
    label: 'Heartbeat',
    description: 'Record a heartbeat to keep the session alive.',
  },
  {
    action: 'recovery',
    label: 'Recovery',
    description: 'Restore a degraded/disconnected broker to a healthy state.',
  },
];

export function describeAction(action: BrokerAction): BrokerActionDescriptor {
  return BROKER_ACTIONS.find((descriptor) => descriptor.action === action)!;
}

/**
 * Whether a specific action is permitted for a status. Deterministic.
 * - `reconnect` only from DISCONNECTED.
 * - `failover` from any active or disconnected state.
 * - `health_check` / `heartbeat` from any operational (connected) state.
 * - `recovery` from DEGRADED or DISCONNECTED.
 */
export function canApplyAction(status: BrokerStatus, action: BrokerAction): boolean {
  switch (action) {
    case 'reconnect':
      return status === 'DISCONNECTED';
    case 'failover':
      return isActiveStatus(status) || status === 'DISCONNECTED';
    case 'health_check':
    case 'heartbeat':
      return isOperationalStatus(status);
    case 'recovery':
      return status === 'DEGRADED' || status === 'DISCONNECTED';
  }
}

export function permittedActions(status: BrokerStatus): BrokerAction[] {
  return BROKER_ACTIONS.map((descriptor) => descriptor.action).filter((action) =>
    canApplyAction(status, action),
  );
}

/* --------------------------------- events ---------------------------------- */

export type BrokerEventType =
  | 'REGISTERED'
  | 'CONFIGURED'
  | 'AUTHENTICATED'
  | 'CONNECTED'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'ARCHIVED'
  | 'RECONNECTED'
  | 'FAILED_OVER'
  | 'HEALTH_CHECKED'
  | 'HEARTBEAT'
  | 'RECOVERED';

const EVENT_LABELS: Record<BrokerEventType, string> = {
  REGISTERED: 'Registered',
  CONFIGURED: 'Configured',
  AUTHENTICATED: 'Authenticated',
  CONNECTED: 'Connected',
  HEALTHY: 'Healthy',
  DEGRADED: 'Degraded',
  DISCONNECTED: 'Disconnected',
  ARCHIVED: 'Archived',
  RECONNECTED: 'Reconnected',
  FAILED_OVER: 'Failed over',
  HEALTH_CHECKED: 'Health checked',
  HEARTBEAT: 'Heartbeat',
  RECOVERED: 'Recovered',
};

export function describeEvent(type: BrokerEventType): {
  readonly type: BrokerEventType;
  readonly label: string;
} {
  return { type, label: EVENT_LABELS[type] };
}
