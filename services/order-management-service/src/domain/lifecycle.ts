/**
 * The REAL order lifecycle application logic — deterministic, immutable, no IO. Given an order and a
 * governed step (a status transition, a fill, or an action), it produces the next immutable `Order`
 * with the appended lifecycle event, state-history entry and audit record, enforcing the
 * `@platform/order-sdk` state-machine transition table. It computes fill bookkeeping (filled /
 * remaining quantity, average execution price) — standard OMS arithmetic, NOT market data or PnL.
 *
 * It does NOT route to any broker/exchange, speak FIX, or perform execution — routing is recorded as
 * an abstract `OrderRoute` and the actual venue interaction happens downstream.
 */
import {
  averageFillPrice,
  canApplyAction,
  canTransition,
  isTerminalStatus,
  remainingQuantity,
  totalFilledQuantity,
  type ExecutionMode,
  type Order,
  type OrderAction,
  type OrderEvent,
  type OrderEventType,
  type OrderExecution,
  type OrderFill,
  type OrderRequest,
  type OrderRoute,
  type OrderState,
  type OrderStatus,
  type OrderValidation,
} from '@platform/order-sdk';

/** The outcome of a lifecycle operation — success carries the next order; failure carries a reason. */
export type LifecycleResult =
  | { readonly ok: true; readonly order: Order }
  | { readonly ok: false; readonly order: Order; readonly reason: string };

function evt(
  order: Order,
  type: OrderEventType,
  message: string,
  actor: string,
  at: string,
  status?: OrderStatus,
  action?: OrderAction,
  detail?: string,
): OrderEvent {
  return {
    id: `${order.id}:EVT:${(order.events.length + 1).toString().padStart(3, '0')}`,
    type,
    status,
    action,
    message,
    actor,
    at,
    detail,
  };
}

function audit(order: Order, actor: string, action: string, detail: string, at: string) {
  return {
    id: `${order.id}:AUD:${(order.audit.length + 1).toString().padStart(3, '0')}`,
    actor,
    action,
    detail,
    at,
  };
}

/** Build a CREATED order from a validated request (initial event/state/audit). */
export function createOrder(request: OrderRequest, at: string): Order {
  const base: Order = {
    id: request.id,
    clientOrderId: request.clientOrderId,
    symbol: request.symbol,
    side: request.side,
    type: request.type,
    quantity: request.quantity,
    limitPrice: request.limitPrice,
    stopPrice: request.stopPrice,
    trailingAmount: request.trailingAmount,
    displayQuantity: request.displayQuantity,
    timeInForce: request.timeInForce,
    status: 'CREATED',
    suspended: false,
    mode: request.mode,
    account: request.account,
    priority: 0,
    version: 1,
    execution: { filledQuantity: 0, remainingQuantity: request.quantity, fills: [] },
    validation: { status: 'NOT_RUN', checks: [] },
    approvals: [],
    events: [],
    states: [],
    audit: [],
    metadata: request.metadata,
    tags: request.metadata.tags,
    owner: {
      owner: request.requestedBy,
      team: request.metadata.entries.find((e) => e.key === 'team')?.value ?? 'Trading',
      desk: request.metadata.entries.find((e) => e.key === 'desk')?.value ?? 'Systematic',
    },
    createdAt: at,
    updatedAt: at,
    expiresAt: undefined,
  };
  return {
    ...base,
    events: [
      evt(
        base,
        'CREATED',
        `Order ${base.clientOrderId} created for ${base.quantity} ${base.symbol}.`,
        request.requestedBy,
        at,
        'CREATED',
      ),
    ],
    states: [{ status: 'CREATED', at, note: 'Order request captured.' }],
    audit: [
      audit(
        base,
        request.requestedBy,
        'CREATED',
        `Order created (${base.side} ${base.quantity} ${base.symbol}).`,
        at,
      ),
    ],
  };
}

interface TransitionInput {
  readonly to: OrderStatus;
  readonly type: OrderEventType;
  readonly actor: string;
  readonly at: string;
  readonly message: string;
  readonly note?: string;
  readonly patch?: Partial<Order>;
}

/** Apply a status transition if the state machine permits it (immutable). */
export function transitionOrder(order: Order, input: TransitionInput): LifecycleResult {
  if (!canTransition(order.status, input.to)) {
    return { ok: false, order, reason: `illegal transition ${order.status} → ${input.to}` };
  }
  const event = evt(order, input.type, input.message, input.actor, input.at, input.to);
  const state: OrderState = { status: input.to, at: input.at, note: input.note ?? input.message };
  const auditEntry = audit(order, input.actor, input.type, input.message, input.at);
  return {
    ok: true,
    order: {
      ...order,
      ...input.patch,
      status: input.to,
      updatedAt: input.at,
      events: [...order.events, event],
      states: [...order.states, state],
      audit: [...order.audit, auditEntry],
    },
  };
}

/** Attach a validation result and transition CREATED → VALIDATED (or → REJECTED on failure). */
export function validateOrder(
  order: Order,
  validation: OrderValidation,
  actor: string,
  at: string,
): LifecycleResult {
  if (validation.status === 'PASSED') {
    return transitionOrder(order, {
      to: 'VALIDATED',
      type: 'VALIDATED',
      actor,
      at,
      message: `Validation passed (${validation.checks.length} checks).`,
      patch: { validation },
    });
  }
  const failed = validation.checks
    .filter((c) => !c.passed)
    .map((c) => c.id)
    .join(', ');
  return transitionOrder(order, {
    to: 'REJECTED',
    type: 'REJECTED',
    actor,
    at,
    message: `Validation failed: ${failed}.`,
    patch: { validation },
  });
}

/** VALIDATED → PENDING_APPROVAL. */
export function requestApproval(order: Order, actor: string, at: string): LifecycleResult {
  return transitionOrder(order, {
    to: 'PENDING_APPROVAL',
    type: 'APPROVAL_REQUESTED',
    actor,
    at,
    message: 'Approval requested.',
    patch: {
      approvals: [
        ...order.approvals,
        {
          id: `${order.id}:APR:${order.approvals.length + 1}`,
          role: 'trading-governance',
          status: 'PENDING',
        },
      ],
    },
  });
}

/** PENDING_APPROVAL → APPROVED (or → REJECTED). Decision made by governance elsewhere; recorded here. */
export function decideApproval(
  order: Order,
  approved: boolean,
  decidedBy: string,
  at: string,
  rationale?: string,
): LifecycleResult {
  const approvals = order.approvals.map((approval) =>
    approval.status === 'PENDING'
      ? {
          ...approval,
          status: approved ? ('APPROVED' as const) : ('REJECTED' as const),
          decidedBy,
          decidedAt: at,
          rationale,
        }
      : approval,
  );
  if (approved)
    return transitionOrder(order, {
      to: 'APPROVED',
      type: 'APPROVED',
      actor: decidedBy,
      at,
      message: 'Order approved for routing.',
      patch: { approvals },
    });
  return transitionOrder(order, {
    to: 'REJECTED',
    type: 'REJECTED',
    actor: decidedBy,
    at,
    message: `Order approval rejected${rationale ? `: ${rationale}` : ''}.`,
    patch: { approvals },
  });
}

/** APPROVED → QUEUED, recording the target execution route (an abstraction only). */
export function queueOrder(
  order: Order,
  route: OrderRoute,
  actor: string,
  at: string,
): LifecycleResult {
  const routed: OrderRoute = { ...route, routedAt: at };
  return transitionOrder(order, {
    to: 'QUEUED',
    type: 'QUEUED',
    actor,
    at,
    message: `Queued for ${routed.venue} (${routed.mode.toLowerCase()}).`,
    patch: { route: routed, execution: { ...order.execution, route: routed } },
  });
}

/** QUEUED → SUBMITTED. */
export function submitOrder(order: Order, actor: string, at: string): LifecycleResult {
  return transitionOrder(order, {
    to: 'SUBMITTED',
    type: 'SUBMITTED',
    actor,
    at,
    message: `Submitted to ${order.route?.venue ?? 'venue'}.`,
  });
}

/** SUBMITTED → ACCEPTED. */
export function acceptOrder(order: Order, actor: string, at: string): LifecycleResult {
  return transitionOrder(order, {
    to: 'ACCEPTED',
    type: 'ACCEPTED',
    actor,
    at,
    message: 'Accepted / working at the venue.',
  });
}

/**
 * Record a fill against a working order. Computes filled/remaining quantity and the average
 * execution price, then transitions ACCEPTED/PARTIALLY_FILLED → PARTIALLY_FILLED or FILLED.
 */
export function recordFill(
  order: Order,
  fill: OrderFill,
  actor: string,
  at: string,
): LifecycleResult {
  if (order.status !== 'ACCEPTED' && order.status !== 'PARTIALLY_FILLED') {
    return { ok: false, order, reason: `cannot fill an order in status ${order.status}` };
  }
  if (fill.quantity <= 0) return { ok: false, order, reason: 'fill quantity must be positive' };
  const fills = [...order.execution.fills, fill];
  const filled = totalFilledQuantity(fills);
  if (filled > order.quantity + 1e-9)
    return { ok: false, order, reason: 'fill would exceed order quantity' };
  const remaining = remainingQuantity(order.quantity, fills);
  const execution: OrderExecution = {
    filledQuantity: filled,
    remainingQuantity: remaining,
    averagePrice: averageFillPrice(fills),
    lastFillAt: at,
    fills,
    route: order.execution.route,
  };
  const complete = remaining <= 1e-9;
  return transitionOrder(order, {
    to: complete ? 'FILLED' : 'PARTIALLY_FILLED',
    type: complete ? 'FILL' : 'PARTIAL_FILL',
    actor,
    at,
    message: `${complete ? 'Filled' : 'Partial fill'} ${fill.quantity} @ ${fill.price} (${filled}/${order.quantity}).`,
    patch: { execution },
  });
}

export interface AmendChanges {
  readonly quantity?: number;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly trailingAmount?: number;
  readonly displayQuantity?: number;
}

/** Apply a non-transition action (suspend/resume/amend/replace) or a transition action (cancel/retry). */
export function applyAction(
  order: Order,
  action: OrderAction,
  actor: string,
  at: string,
  changes?: AmendChanges,
): LifecycleResult {
  if (!canApplyAction(order.status, order.suspended, action)) {
    return {
      ok: false,
      order,
      reason: `action '${action}' not permitted in status ${order.status}${order.suspended ? ' (suspended)' : ''}`,
    };
  }
  switch (action) {
    case 'cancel':
      return transitionOrder(order, {
        to: 'CANCELLED',
        type: 'CANCELLED',
        actor,
        at,
        message: 'Order cancelled.',
      });
    case 'retry':
      return transitionOrder(order, {
        to: 'QUEUED',
        type: 'RETRIED',
        actor,
        at,
        message: `Retry: re-queued (was ${order.status}).`,
        patch: { version: order.version + 1 },
      });
    case 'suspend':
      return {
        ok: true,
        order: withFlag(order, true, 'SUSPENDED', 'Order suspended (held).', actor, at),
      };
    case 'resume':
      return { ok: true, order: withFlag(order, false, 'RESUMED', 'Order resumed.', actor, at) };
    case 'amend':
      return { ok: true, order: withEconomics(order, changes ?? {}, 'AMENDED', actor, at) };
    case 'replace':
      return { ok: true, order: withEconomics(order, changes ?? {}, 'REPLACED', actor, at) };
  }
}

function withFlag(
  order: Order,
  suspended: boolean,
  type: OrderEventType,
  message: string,
  actor: string,
  at: string,
): Order {
  const event = evt(
    order,
    type,
    message,
    actor,
    at,
    order.status,
    type === 'SUSPENDED' ? 'suspend' : 'resume',
  );
  return {
    ...order,
    suspended,
    updatedAt: at,
    events: [...order.events, event],
    states: [...order.states, { status: order.status, at, note: message }],
    audit: [...order.audit, audit(order, actor, type, message, at)],
  };
}

function withEconomics(
  order: Order,
  changes: AmendChanges,
  type: OrderEventType,
  actor: string,
  at: string,
): Order {
  const quantity = changes.quantity ?? order.quantity;
  const remaining = Math.max(0, quantity - order.execution.filledQuantity);
  const message = `${type === 'AMENDED' ? 'Amended' : 'Replaced'} (v${order.version + 1}): ${describeChanges(changes) || 'no economic change'}.`;
  const event = evt(
    order,
    type,
    message,
    actor,
    at,
    order.status,
    type === 'AMENDED' ? 'amend' : 'replace',
  );
  return {
    ...order,
    quantity,
    limitPrice: changes.limitPrice ?? order.limitPrice,
    stopPrice: changes.stopPrice ?? order.stopPrice,
    trailingAmount: changes.trailingAmount ?? order.trailingAmount,
    displayQuantity: changes.displayQuantity ?? order.displayQuantity,
    version: order.version + 1,
    updatedAt: at,
    execution: { ...order.execution, remainingQuantity: remaining },
    events: [...order.events, event],
    states: [...order.states, { status: order.status, at, note: message }],
    audit: [...order.audit, audit(order, actor, type, message, at)],
  };
}

function describeChanges(changes: AmendChanges): string {
  const parts: string[] = [];
  if (changes.quantity !== undefined) parts.push(`qty=${changes.quantity}`);
  if (changes.limitPrice !== undefined) parts.push(`limit=${changes.limitPrice}`);
  if (changes.stopPrice !== undefined) parts.push(`stop=${changes.stopPrice}`);
  if (changes.trailingAmount !== undefined) parts.push(`trail=${changes.trailingAmount}`);
  if (changes.displayQuantity !== undefined) parts.push(`display=${changes.displayQuantity}`);
  return parts.join(', ');
}

/** Expire a working order per its time-in-force (QUEUED/SUBMITTED/ACCEPTED/PARTIALLY_FILLED → EXPIRED). */
export function expireOrder(order: Order, actor: string, at: string): LifecycleResult {
  if (isTerminalStatus(order.status))
    return { ok: false, order, reason: `cannot expire a ${order.status} order` };
  return transitionOrder(order, {
    to: 'EXPIRED',
    type: 'EXPIRED',
    actor,
    at,
    message: `Expired (${order.timeInForce}).`,
  });
}

/** A default abstract route for a mode (an execution-venue abstraction — never a real endpoint). */
export function defaultRoute(mode: ExecutionMode): OrderRoute {
  const venue =
    mode === 'LIVE'
      ? 'live-trading-gateway'
      : mode === 'SIMULATED'
        ? 'execution-simulator'
        : 'paper-venue';
  return { venue, destination: 'SMART', mode, gatewayRef: `gw:${venue}` };
}
