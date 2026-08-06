/**
 * The canonical **order lifecycle state machine** — the single source of truth for order statuses,
 * the allowed transitions between them, the lifecycle actions and the lifecycle events. This is
 * REAL, deterministic lifecycle logic (not a placeholder): the transition table and the action
 * predicates decide *whether* a governed transition is structurally permitted. The transition itself
 * (and any routing to an execution venue) happens in the Order Management Service and, ultimately,
 * downstream engines — NEVER here.
 *
 * Contains NO broker SDK, NO exchange API, NO FIX, NO transport. Pure vocabulary + rules.
 */

/** The 12 canonical order statuses (lifecycle order). */
export type OrderStatus =
  | 'CREATED'
  | 'VALIDATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'QUEUED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';

export type OrderStatusCategory = 'PRE_TRADE' | 'WORKING' | 'TERMINAL';

export interface OrderStatusDescriptor {
  readonly status: OrderStatus;
  readonly label: string;
  readonly description: string;
  readonly category: OrderStatusCategory;
  /** No further automatic lifecycle progression (a `retry` may still re-queue a failed order). */
  readonly terminal: boolean;
}

/** The statuses in canonical lifecycle order. */
export const ORDER_STATUSES: readonly OrderStatus[] = [
  'CREATED',
  'VALIDATED',
  'PENDING_APPROVAL',
  'APPROVED',
  'QUEUED',
  'SUBMITTED',
  'ACCEPTED',
  'PARTIALLY_FILLED',
  'FILLED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED',
];

const STATUS_DESCRIPTORS: Record<OrderStatus, OrderStatusDescriptor> = {
  CREATED: {
    status: 'CREATED',
    label: 'Created',
    description: 'The order request has been captured but not yet validated.',
    category: 'PRE_TRADE',
    terminal: false,
  },
  VALIDATED: {
    status: 'VALIDATED',
    label: 'Validated',
    description: 'The order passed structural/pre-trade validation.',
    category: 'PRE_TRADE',
    terminal: false,
  },
  PENDING_APPROVAL: {
    status: 'PENDING_APPROVAL',
    label: 'Pending approval',
    description: 'Awaiting a governance/risk approval decision.',
    category: 'PRE_TRADE',
    terminal: false,
  },
  APPROVED: {
    status: 'APPROVED',
    label: 'Approved',
    description: 'Approved for routing; not yet queued.',
    category: 'PRE_TRADE',
    terminal: false,
  },
  QUEUED: {
    status: 'QUEUED',
    label: 'Queued',
    description: 'Queued for submission to an execution venue.',
    category: 'WORKING',
    terminal: false,
  },
  SUBMITTED: {
    status: 'SUBMITTED',
    label: 'Submitted',
    description: 'Routed to the execution venue; awaiting acknowledgement.',
    category: 'WORKING',
    terminal: false,
  },
  ACCEPTED: {
    status: 'ACCEPTED',
    label: 'Accepted',
    description: 'Acknowledged/working at the venue.',
    category: 'WORKING',
    terminal: false,
  },
  PARTIALLY_FILLED: {
    status: 'PARTIALLY_FILLED',
    label: 'Partially filled',
    description: 'Partially executed; the remainder is still working.',
    category: 'WORKING',
    terminal: false,
  },
  FILLED: {
    status: 'FILLED',
    label: 'Filled',
    description: 'Fully executed.',
    category: 'TERMINAL',
    terminal: true,
  },
  CANCELLED: {
    status: 'CANCELLED',
    label: 'Cancelled',
    description: 'Cancelled before completion.',
    category: 'TERMINAL',
    terminal: true,
  },
  REJECTED: {
    status: 'REJECTED',
    label: 'Rejected',
    description: 'Rejected by validation, approval or the venue.',
    category: 'TERMINAL',
    terminal: true,
  },
  EXPIRED: {
    status: 'EXPIRED',
    label: 'Expired',
    description: 'Expired per its time-in-force before completion.',
    category: 'TERMINAL',
    terminal: true,
  },
};

export function describeStatus(status: OrderStatus): OrderStatusDescriptor {
  return STATUS_DESCRIPTORS[status];
}

export function statusOrder(status: OrderStatus): number {
  return ORDER_STATUSES.indexOf(status);
}

/** Whether a status is terminal (no further automatic progression). */
export function isTerminalStatus(status: OrderStatus): boolean {
  return STATUS_DESCRIPTORS[status].terminal;
}

/** Whether a status is a working (live at/toward the venue) status. */
export function isWorkingStatus(status: OrderStatus): boolean {
  return STATUS_DESCRIPTORS[status].category === 'WORKING';
}

/** Whether a status is active (not terminal) — still in the order's lifecycle. */
export function isActiveStatus(status: OrderStatus): boolean {
  return !isTerminalStatus(status);
}

/** Whether a failed order (rejected/expired) may be retried (re-queued). */
export function isRetryableStatus(status: OrderStatus): boolean {
  return status === 'REJECTED' || status === 'EXPIRED';
}

/**
 * The order transition table — the allowed target statuses for each status. This is the state
 * machine: a transition not present here is invalid. `REJECTED`/`EXPIRED` expose `QUEUED` because a
 * `retry` action re-injects a failed order into the working set.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  CREATED: ['VALIDATED', 'REJECTED', 'CANCELLED'],
  VALIDATED: ['PENDING_APPROVAL', 'REJECTED', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['QUEUED', 'CANCELLED'],
  QUEUED: ['SUBMITTED', 'CANCELLED', 'EXPIRED'],
  SUBMITTED: ['ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED'],
  PARTIALLY_FILLED: ['PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED'],
  FILLED: [],
  CANCELLED: [],
  REJECTED: ['QUEUED'],
  EXPIRED: ['QUEUED'],
};

/** The allowed target statuses from `status`. */
export function nextStatuses(status: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[status];
}

/** Whether a transition `from → to` is permitted by the state machine. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** The primary "happy path" successor status, or null at a terminal state. */
export function happyPathNext(status: OrderStatus): OrderStatus | null {
  const path: Partial<Record<OrderStatus, OrderStatus>> = {
    CREATED: 'VALIDATED',
    VALIDATED: 'PENDING_APPROVAL',
    PENDING_APPROVAL: 'APPROVED',
    APPROVED: 'QUEUED',
    QUEUED: 'SUBMITTED',
    SUBMITTED: 'ACCEPTED',
    ACCEPTED: 'FILLED',
    PARTIALLY_FILLED: 'FILLED',
  };
  return path[status] ?? null;
}

/* --------------------------------- actions --------------------------------- */

/** The lifecycle actions an operator/engine may request on an order. */
export type OrderAction = 'replace' | 'amend' | 'suspend' | 'resume' | 'cancel' | 'retry';

export interface OrderActionDescriptor {
  readonly action: OrderAction;
  readonly label: string;
  readonly description: string;
  /** Whether the action changes the order's economics (price/quantity). */
  readonly modifies: boolean;
}

export const ORDER_ACTIONS: readonly OrderActionDescriptor[] = [
  {
    action: 'amend',
    label: 'Amend',
    description: 'Modify price/quantity of a working, not-fully-filled order in place.',
    modifies: true,
  },
  {
    action: 'replace',
    label: 'Replace',
    description: 'Cancel/replace a working order with new economics (new version).',
    modifies: true,
  },
  {
    action: 'suspend',
    label: 'Suspend',
    description: 'Temporarily hold a working order without cancelling it.',
    modifies: false,
  },
  { action: 'resume', label: 'Resume', description: 'Resume a suspended order.', modifies: false },
  {
    action: 'cancel',
    label: 'Cancel',
    description: 'Cancel an active (non-terminal) order.',
    modifies: false,
  },
  {
    action: 'retry',
    label: 'Retry',
    description: 'Re-queue a rejected or expired order.',
    modifies: false,
  },
];

export function describeAction(action: OrderAction): OrderActionDescriptor {
  return ORDER_ACTIONS.find((descriptor) => descriptor.action === action)!;
}

const WORKING: readonly OrderStatus[] = ['QUEUED', 'SUBMITTED', 'ACCEPTED', 'PARTIALLY_FILLED'];
const AMENDABLE: readonly OrderStatus[] = [
  'CREATED',
  'VALIDATED',
  'APPROVED',
  'QUEUED',
  'SUBMITTED',
  'ACCEPTED',
  'PARTIALLY_FILLED',
];

/** Whether a specific action is permitted for a status + suspension flag. Deterministic. */
export function canApplyAction(
  status: OrderStatus,
  suspended: boolean,
  action: OrderAction,
): boolean {
  switch (action) {
    case 'cancel':
      return isActiveStatus(status);
    case 'retry':
      return isRetryableStatus(status);
    case 'suspend':
      return !suspended && WORKING.includes(status);
    case 'resume':
      return suspended;
    case 'amend':
      return !suspended && AMENDABLE.includes(status);
    case 'replace':
      return !suspended && WORKING.includes(status);
  }
}

/** All actions currently permitted for a status + suspension flag. */
export function permittedActions(status: OrderStatus, suspended: boolean): OrderAction[] {
  return ORDER_ACTIONS.map((descriptor) => descriptor.action).filter((action) =>
    canApplyAction(status, suspended, action),
  );
}

/* --------------------------------- events ---------------------------------- */

/** The lifecycle event types recorded on an order's timeline. */
export type OrderEventType =
  | 'CREATED'
  | 'VALIDATED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVED'
  | 'QUEUED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'PARTIAL_FILL'
  | 'FILL'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'AMENDED'
  | 'REPLACED'
  | 'SUSPENDED'
  | 'RESUMED'
  | 'RETRIED'
  | 'ROUTED';

export interface OrderEventDescriptor {
  readonly type: OrderEventType;
  readonly label: string;
}

const EVENT_LABELS: Record<OrderEventType, string> = {
  CREATED: 'Created',
  VALIDATED: 'Validated',
  APPROVAL_REQUESTED: 'Approval requested',
  APPROVED: 'Approved',
  QUEUED: 'Queued',
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  PARTIAL_FILL: 'Partial fill',
  FILL: 'Fill',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  AMENDED: 'Amended',
  REPLACED: 'Replaced',
  SUSPENDED: 'Suspended',
  RESUMED: 'Resumed',
  RETRIED: 'Retried',
  ROUTED: 'Routed',
};

export function describeEvent(type: OrderEventType): OrderEventDescriptor {
  return { type, label: EVENT_LABELS[type] };
}
