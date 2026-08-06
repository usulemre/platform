/**
 * The REAL execution lifecycle application logic — deterministic, immutable, no IO. Given an
 * execution and a governed step (a status transition, a slice execution, or an action), it produces
 * the next immutable `Execution` with the appended lifecycle event, state-history entry and audit
 * record, enforcing the `@platform/execution-engine-sdk` state-machine transition table. It computes
 * slice bookkeeping (executed / remaining quantity, average execution price) — standard execution
 * arithmetic, NOT market data or PnL.
 *
 * It does NOT route to any broker/exchange, speak FIX, or open a WebSocket — venue interaction is an
 * abstraction dispatched through the venue port, and the actual venue lives downstream.
 */
import {
  averageExecutionPrice,
  canApplyAction,
  canTransition,
  isTerminalStatus,
  remainingQuantity,
  totalExecutedQuantity,
  type Execution,
  type ExecutionAction,
  type ExecutionEvent,
  type ExecutionEventType,
  type ExecutionPlan,
  type ExecutionRequest,
  type ExecutionResult,
  type ExecutionState,
  type ExecutionStatus,
  type ExecutionTask,
  type ExecutionValidation,
  type SliceResult,
} from '@platform/execution-engine-sdk';

export type LifecycleResult =
  | { readonly ok: true; readonly execution: Execution }
  | { readonly ok: false; readonly execution: Execution; readonly reason: string };

function evt(
  execution: Execution,
  type: ExecutionEventType,
  message: string,
  actor: string,
  at: string,
  status?: ExecutionStatus,
  action?: ExecutionAction,
): ExecutionEvent {
  return {
    id: `${execution.id}:EVT:${(execution.events.length + 1).toString().padStart(3, '0')}`,
    type,
    status,
    action,
    message,
    actor,
    at,
  };
}

function audit(execution: Execution, actor: string, action: string, detail: string, at: string) {
  return {
    id: `${execution.id}:AUD:${(execution.audit.length + 1).toString().padStart(3, '0')}`,
    actor,
    action,
    detail,
    at,
  };
}

/** Build an ORDER_RECEIVED execution from a request (initial event/state/audit). */
export function createExecution(request: ExecutionRequest, at: string): Execution {
  const base: Execution = {
    id: request.id.replace(/^EXR-/, 'EXE-'),
    requestId: request.id,
    orderId: request.orderId,
    clientOrderId: request.clientOrderId,
    symbol: request.symbol,
    side: request.side,
    quantity: request.quantity,
    orderType: request.orderType,
    limitPrice: request.limitPrice,
    mode: request.mode,
    status: 'ORDER_RECEIVED',
    paused: false,
    priority: request.priority,
    attempts: 0,
    policies: request.policies,
    validation: { status: 'NOT_RUN', checks: [] },
    result: { executedQuantity: 0, remainingQuantity: request.quantity, slices: [], venue: '' },
    tasks: [],
    events: [],
    states: [],
    audit: [],
    metadata: request.metadata,
    tags: request.metadata.tags,
    sessionId: request.metadata.sessionId,
    owner: { owner: request.requestedBy, team: 'Execution', desk: 'Systematic' },
    createdAt: at,
    updatedAt: at,
  };
  return {
    ...base,
    events: [
      evt(
        base,
        'RECEIVED',
        `Execution received for order ${base.clientOrderId} (${base.quantity} ${base.symbol}).`,
        request.requestedBy,
        at,
        'ORDER_RECEIVED',
      ),
    ],
    states: [{ status: 'ORDER_RECEIVED', at, note: 'Approved order received from OMS.' }],
    audit: [
      audit(
        base,
        request.requestedBy,
        'RECEIVED',
        `Execution received (${base.side} ${base.quantity} ${base.symbol}).`,
        at,
      ),
    ],
  };
}

interface TransitionInput {
  readonly to: ExecutionStatus;
  readonly type: ExecutionEventType;
  readonly actor: string;
  readonly at: string;
  readonly message: string;
  readonly note?: string;
  readonly patch?: Partial<Execution>;
}

/** Apply a status transition if the state machine permits it (immutable). */
export function transitionExecution(execution: Execution, input: TransitionInput): LifecycleResult {
  if (!canTransition(execution.status, input.to)) {
    return { ok: false, execution, reason: `illegal transition ${execution.status} → ${input.to}` };
  }
  return {
    ok: true,
    execution: {
      ...execution,
      ...input.patch,
      status: input.to,
      updatedAt: input.at,
      events: [
        ...execution.events,
        evt(execution, input.type, input.message, input.actor, input.at, input.to),
      ],
      states: [
        ...execution.states,
        { status: input.to, at: input.at, note: input.note ?? input.message },
      ],
      audit: [
        ...execution.audit,
        audit(execution, input.actor, input.type, input.message, input.at),
      ],
    },
  };
}

/** ORDER_RECEIVED → EXECUTION_PLANNED, attaching the plan and its tasks. */
export function planStep(
  execution: Execution,
  plan: ExecutionPlan,
  tasks: readonly ExecutionTask[],
  actor: string,
  at: string,
): LifecycleResult {
  return transitionExecution(execution, {
    to: 'EXECUTION_PLANNED',
    type: 'PLANNED',
    actor,
    at,
    message: plan.note,
    patch: {
      plan,
      tasks,
      priority: plan.priority,
      result: { ...execution.result, venue: plan.venue },
    },
  });
}

/** EXECUTION_PLANNED → EXECUTION_VALIDATED (or → FAILED on validation failure). */
export function validateStep(
  execution: Execution,
  validation: ExecutionValidation,
  actor: string,
  at: string,
): LifecycleResult {
  if (validation.status === 'PASSED') {
    return transitionExecution(execution, {
      to: 'EXECUTION_VALIDATED',
      type: 'VALIDATED',
      actor,
      at,
      message: `Validated (${validation.checks.length} checks).`,
      patch: { validation },
    });
  }
  const failed = validation.checks
    .filter((c) => !c.passed)
    .map((c) => c.id)
    .join(', ');
  return transitionExecution(execution, {
    to: 'FAILED',
    type: 'FAILED',
    actor,
    at,
    message: `Validation failed: ${failed}.`,
    patch: { validation },
  });
}

/** EXECUTION_VALIDATED → WAITING_FOR_VENUE. */
export function queueStep(execution: Execution, actor: string, at: string): LifecycleResult {
  return transitionExecution(execution, {
    to: 'WAITING_FOR_VENUE',
    type: 'QUEUED_FOR_VENUE',
    actor,
    at,
    message: `Queued for ${execution.plan?.venue ?? 'venue'}.`,
  });
}

/** WAITING_FOR_VENUE → EXECUTING. */
export function startStep(execution: Execution, actor: string, at: string): LifecycleResult {
  if (execution.paused) return { ok: false, execution, reason: 'execution is paused' };
  return transitionExecution(execution, {
    to: 'EXECUTING',
    type: 'EXECUTION_STARTED',
    actor,
    at,
    message: `Executing at ${execution.plan?.venue ?? 'venue'}.`,
  });
}

/**
 * Record a slice execution against a working execution. Computes executed/remaining quantity and the
 * average execution price, then transitions EXECUTING/PARTIALLY_EXECUTED → PARTIALLY_EXECUTED or
 * COMPLETED.
 */
export function recordSlice(
  execution: Execution,
  slice: SliceResult,
  actor: string,
  at: string,
): LifecycleResult {
  if (execution.status !== 'EXECUTING' && execution.status !== 'PARTIALLY_EXECUTED') {
    return { ok: false, execution, reason: `cannot execute a slice in status ${execution.status}` };
  }
  if (execution.paused) return { ok: false, execution, reason: 'execution is paused' };
  if (slice.quantity <= 0)
    return { ok: false, execution, reason: 'slice quantity must be positive' };
  const slices = [...execution.result.slices, slice];
  const executed = totalExecutedQuantity(slices);
  if (executed > execution.quantity + 1e-9)
    return { ok: false, execution, reason: 'slice would exceed the execution quantity' };
  const remaining = remainingQuantity(execution.quantity, slices);
  const result: ExecutionResult = {
    executedQuantity: executed,
    remainingQuantity: remaining,
    averagePrice: averageExecutionPrice(slices),
    lastExecutionAt: at,
    slices,
    venue: execution.result.venue || slice.venue,
  };
  const complete = remaining <= 1e-9;
  return transitionExecution(execution, {
    to: complete ? 'COMPLETED' : 'PARTIALLY_EXECUTED',
    type: complete ? 'COMPLETED' : 'SLICE_EXECUTED',
    actor,
    at,
    message: `${complete ? 'Completed' : 'Slice executed'} ${slice.quantity} @ ${slice.price} (${executed}/${execution.quantity}).`,
    patch: { result },
  });
}

/** Fail an active execution (policy timeout / venue error). */
export function failExecution(
  execution: Execution,
  reason: string,
  actor: string,
  at: string,
): LifecycleResult {
  if (isTerminalStatus(execution.status))
    return { ok: false, execution, reason: `cannot fail a ${execution.status} execution` };
  return transitionExecution(execution, {
    to: 'FAILED',
    type: 'FAILED',
    actor,
    at,
    message: `Failed: ${reason}.`,
  });
}

/** Apply a lifecycle action (retry / pause / resume / cancel / replay). */
export function applyAction(
  execution: Execution,
  action: ExecutionAction,
  actor: string,
  at: string,
): LifecycleResult {
  if (!canApplyAction(execution.status, execution.paused, action)) {
    return {
      ok: false,
      execution,
      reason: `action '${action}' not permitted in status ${execution.status}${execution.paused ? ' (paused)' : ''}`,
    };
  }
  switch (action) {
    case 'cancel':
      return transitionExecution(execution, {
        to: 'CANCELLED',
        type: 'CANCELLED',
        actor,
        at,
        message: 'Execution cancelled.',
      });
    case 'retry':
      return transitionExecution(execution, {
        to: 'WAITING_FOR_VENUE',
        type: 'RETRIED',
        actor,
        at,
        message: `Retry: re-queued (attempt ${execution.attempts + 1}).`,
        patch: { attempts: execution.attempts + 1 },
      });
    case 'pause':
      return { ok: true, execution: withPause(execution, true, actor, at) };
    case 'resume':
      return { ok: true, execution: withPause(execution, false, actor, at) };
    case 'replay':
      // Replay is a read-only reconstruction; it does not mutate the execution.
      return { ok: true, execution };
  }
}

function withPause(execution: Execution, paused: boolean, actor: string, at: string): Execution {
  const type: ExecutionEventType = paused ? 'PAUSED' : 'RESUMED';
  const message = paused ? 'Execution paused (held).' : 'Execution resumed.';
  return {
    ...execution,
    paused,
    updatedAt: at,
    events: [
      ...execution.events,
      evt(execution, type, message, actor, at, execution.status, paused ? 'pause' : 'resume'),
    ],
    states: [...execution.states, { status: execution.status, at, note: message }],
    audit: [...execution.audit, audit(execution, actor, type, message, at)],
  };
}

export type { ExecutionState };
