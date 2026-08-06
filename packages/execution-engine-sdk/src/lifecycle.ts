/**
 * The canonical **execution lifecycle state machine** — the single source of truth for execution
 * statuses, the allowed transitions between them, the lifecycle actions and the lifecycle events.
 * This is REAL, deterministic orchestration vocabulary (not a placeholder): the transition table and
 * action predicates decide *whether* a governed transition is structurally permitted. The transition
 * itself, and any routing to an execution venue, happen in the Execution Engine service and, further
 * downstream, in the Execution Simulator / Live Trading Platform — NEVER here.
 *
 * Contains NO broker SDK, NO exchange API, NO FIX, NO REST/WebSocket transport. Pure rules.
 */

/** The 9 canonical execution statuses (lifecycle order). */
export type ExecutionStatus =
  | 'ORDER_RECEIVED'
  | 'EXECUTION_PLANNED'
  | 'EXECUTION_VALIDATED'
  | 'WAITING_FOR_VENUE'
  | 'EXECUTING'
  | 'PARTIALLY_EXECUTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type ExecutionStatusCategory = 'INTAKE' | 'WORKING' | 'TERMINAL';

export interface ExecutionStatusDescriptor {
  readonly status: ExecutionStatus;
  readonly label: string;
  readonly description: string;
  readonly category: ExecutionStatusCategory;
  /** No further automatic progression (a `retry` may still re-queue a failed execution). */
  readonly terminal: boolean;
}

export const EXECUTION_STATUSES: readonly ExecutionStatus[] = [
  'ORDER_RECEIVED',
  'EXECUTION_PLANNED',
  'EXECUTION_VALIDATED',
  'WAITING_FOR_VENUE',
  'EXECUTING',
  'PARTIALLY_EXECUTED',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
];

const STATUS_DESCRIPTORS: Record<ExecutionStatus, ExecutionStatusDescriptor> = {
  ORDER_RECEIVED: {
    status: 'ORDER_RECEIVED',
    label: 'Order received',
    description: 'An approved order was received from the OMS for execution.',
    category: 'INTAKE',
    terminal: false,
  },
  EXECUTION_PLANNED: {
    status: 'EXECUTION_PLANNED',
    label: 'Execution planned',
    description: 'An execution plan was produced from the request and its policies.',
    category: 'INTAKE',
    terminal: false,
  },
  EXECUTION_VALIDATED: {
    status: 'EXECUTION_VALIDATED',
    label: 'Execution validated',
    description: 'The plan cleared policy and risk validation.',
    category: 'INTAKE',
    terminal: false,
  },
  WAITING_FOR_VENUE: {
    status: 'WAITING_FOR_VENUE',
    label: 'Waiting for venue',
    description: 'Queued for the selected execution venue (an abstraction).',
    category: 'WORKING',
    terminal: false,
  },
  EXECUTING: {
    status: 'EXECUTING',
    label: 'Executing',
    description: 'Actively executing at the venue.',
    category: 'WORKING',
    terminal: false,
  },
  PARTIALLY_EXECUTED: {
    status: 'PARTIALLY_EXECUTED',
    label: 'Partially executed',
    description: 'Part of the quantity executed; the remainder is still working.',
    category: 'WORKING',
    terminal: false,
  },
  COMPLETED: {
    status: 'COMPLETED',
    label: 'Completed',
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
  FAILED: {
    status: 'FAILED',
    label: 'Failed',
    description: 'Failed (policy timeout, venue error, or validation failure).',
    category: 'TERMINAL',
    terminal: true,
  },
};

export function describeStatus(status: ExecutionStatus): ExecutionStatusDescriptor {
  return STATUS_DESCRIPTORS[status];
}

export function statusOrder(status: ExecutionStatus): number {
  return EXECUTION_STATUSES.indexOf(status);
}

export function isTerminalStatus(status: ExecutionStatus): boolean {
  return STATUS_DESCRIPTORS[status].terminal;
}

export function isWorkingStatus(status: ExecutionStatus): boolean {
  return STATUS_DESCRIPTORS[status].category === 'WORKING';
}

export function isActiveStatus(status: ExecutionStatus): boolean {
  return !isTerminalStatus(status);
}

/** Whether a failed execution may be retried (re-queued to the venue). */
export function isRetryableStatus(status: ExecutionStatus): boolean {
  return status === 'FAILED';
}

/**
 * The execution transition table — the allowed target statuses for each status. A transition not
 * present here is invalid. `FAILED` exposes `WAITING_FOR_VENUE` because a `retry` re-queues.
 */
export const EXECUTION_TRANSITIONS: Record<ExecutionStatus, readonly ExecutionStatus[]> = {
  ORDER_RECEIVED: ['EXECUTION_PLANNED', 'CANCELLED', 'FAILED'],
  EXECUTION_PLANNED: ['EXECUTION_VALIDATED', 'CANCELLED', 'FAILED'],
  EXECUTION_VALIDATED: ['WAITING_FOR_VENUE', 'CANCELLED', 'FAILED'],
  WAITING_FOR_VENUE: ['EXECUTING', 'CANCELLED', 'FAILED'],
  EXECUTING: ['PARTIALLY_EXECUTED', 'COMPLETED', 'CANCELLED', 'FAILED'],
  PARTIALLY_EXECUTED: ['PARTIALLY_EXECUTED', 'COMPLETED', 'CANCELLED', 'FAILED'],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: ['WAITING_FOR_VENUE'],
};

export function nextStatuses(status: ExecutionStatus): readonly ExecutionStatus[] {
  return EXECUTION_TRANSITIONS[status];
}

export function canTransition(from: ExecutionStatus, to: ExecutionStatus): boolean {
  return EXECUTION_TRANSITIONS[from].includes(to);
}

/** The primary "happy path" successor status, or null at a terminal state. */
export function happyPathNext(status: ExecutionStatus): ExecutionStatus | null {
  const path: Partial<Record<ExecutionStatus, ExecutionStatus>> = {
    ORDER_RECEIVED: 'EXECUTION_PLANNED',
    EXECUTION_PLANNED: 'EXECUTION_VALIDATED',
    EXECUTION_VALIDATED: 'WAITING_FOR_VENUE',
    WAITING_FOR_VENUE: 'EXECUTING',
    EXECUTING: 'COMPLETED',
    PARTIALLY_EXECUTED: 'COMPLETED',
  };
  return path[status] ?? null;
}

/* --------------------------------- actions --------------------------------- */

/** The lifecycle actions an operator/engine may request on an execution. */
export type ExecutionAction = 'retry' | 'pause' | 'resume' | 'cancel' | 'replay';

export interface ExecutionActionDescriptor {
  readonly action: ExecutionAction;
  readonly label: string;
  readonly description: string;
}

export const EXECUTION_ACTIONS: readonly ExecutionActionDescriptor[] = [
  { action: 'retry', label: 'Retry', description: 'Re-queue a failed execution to the venue.' },
  {
    action: 'pause',
    label: 'Pause',
    description: 'Temporarily hold a working execution without cancelling it.',
  },
  { action: 'resume', label: 'Resume', description: 'Resume a paused execution.' },
  { action: 'cancel', label: 'Cancel', description: 'Cancel an active (non-terminal) execution.' },
  {
    action: 'replay',
    label: 'Replay',
    description: 'Reconstruct the execution timeline from its events (read-only).',
  },
];

export function describeAction(action: ExecutionAction): ExecutionActionDescriptor {
  return EXECUTION_ACTIONS.find((descriptor) => descriptor.action === action)!;
}

const WORKING: readonly ExecutionStatus[] = [
  'WAITING_FOR_VENUE',
  'EXECUTING',
  'PARTIALLY_EXECUTED',
];

/** Whether a specific action is permitted for a status + pause flag. Deterministic. */
export function canApplyAction(
  status: ExecutionStatus,
  paused: boolean,
  action: ExecutionAction,
): boolean {
  switch (action) {
    case 'cancel':
      return isActiveStatus(status);
    case 'retry':
      return isRetryableStatus(status);
    case 'pause':
      return !paused && WORKING.includes(status);
    case 'resume':
      return paused;
    case 'replay':
      return true;
  }
}

export function permittedActions(status: ExecutionStatus, paused: boolean): ExecutionAction[] {
  return EXECUTION_ACTIONS.map((descriptor) => descriptor.action).filter((action) =>
    canApplyAction(status, paused, action),
  );
}

/* --------------------------------- events ---------------------------------- */

/** The lifecycle event types recorded on an execution's timeline. */
export type ExecutionEventType =
  | 'RECEIVED'
  | 'PLANNED'
  | 'POLICY_EVALUATED'
  | 'VALIDATED'
  | 'QUEUED_FOR_VENUE'
  | 'EXECUTION_STARTED'
  | 'SLICE_EXECUTED'
  | 'PARTIALLY_EXECUTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'PAUSED'
  | 'RESUMED'
  | 'RETRIED'
  | 'REPLANNED';

const EVENT_LABELS: Record<ExecutionEventType, string> = {
  RECEIVED: 'Received',
  PLANNED: 'Planned',
  POLICY_EVALUATED: 'Policy evaluated',
  VALIDATED: 'Validated',
  QUEUED_FOR_VENUE: 'Queued for venue',
  EXECUTION_STARTED: 'Execution started',
  SLICE_EXECUTED: 'Slice executed',
  PARTIALLY_EXECUTED: 'Partially executed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  PAUSED: 'Paused',
  RESUMED: 'Resumed',
  RETRIED: 'Retried',
  REPLANNED: 'Replanned',
};

export function describeEvent(type: ExecutionEventType): {
  readonly type: ExecutionEventType;
  readonly label: string;
} {
  return { type, label: EVENT_LABELS[type] };
}
