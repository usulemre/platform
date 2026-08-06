/**
 * DTO → view-model mappings for the Orders module. All presentation decisions live here so
 * components stay logic-free. Pure and deterministic. Status/type labels and the action-permission
 * predicates come from `@platform/order-sdk`; quantities and prices are formatted, never computed
 * (fill/remaining/average come from the order's own execution record).
 */
import {
  describeAction,
  describeOrderType,
  describeStatus,
  fillRatio,
  permittedActions,
  type ApprovalStatus,
  type ExecutionMode,
  type Order,
  type OrderApproval,
  type OrderEvent,
  type OrderFill,
  type OrderRoute,
  type OrderState,
  type OrderStatus,
  type ValidationStatus,
} from '@platform/order-sdk';
import {
  computeHealth,
  computeMetrics,
  replay,
  type HealthStatus,
  type OrderHealth,
  type OrderMetrics,
  type ReplayResult,
} from './derive';
import type {
  ActionVm,
  ApprovalVm,
  AuditVm,
  CheckVm,
  EventVm,
  FillVm,
  HealthVm,
  MetricsVm,
  OrderDetailVm,
  OrderRowVm,
  OrdersSummaryVm,
  ReplayVm,
  RouteVm,
  StateVm,
  StatusBucketVm,
  StatusVm,
  Tone,
} from './view-model';

const STATUS_TONE: Record<OrderStatus, Tone> = {
  CREATED: 'neutral',
  VALIDATED: 'info',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  QUEUED: 'info',
  SUBMITTED: 'info',
  ACCEPTED: 'info',
  PARTIALLY_FILLED: 'warning',
  FILLED: 'positive',
  CANCELLED: 'neutral',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
};

const MODE_TONE: Record<ExecutionMode, Tone> = {
  PAPER: 'neutral',
  SIMULATED: 'info',
  LIVE: 'danger',
};
const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  PENDING: 'Pending',
  NOT_RUN: 'Not run',
};
const VALIDATION_TONE: Record<ValidationStatus, Tone> = {
  PASSED: 'positive',
  FAILED: 'danger',
  PENDING: 'warning',
  NOT_RUN: 'neutral',
};
const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NOT_REQUESTED: 'Not requested',
};
const APPROVAL_TONE: Record<ApprovalStatus, Tone> = {
  PENDING: 'warning',
  APPROVED: 'positive',
  REJECTED: 'danger',
  NOT_REQUESTED: 'neutral',
};
const HEALTH_TONE: Record<HealthStatus, Tone> = {
  HEALTHY: 'positive',
  DEGRADED: 'warning',
  UNHEALTHY: 'danger',
};
const EVENT_TONE: Record<string, Tone> = {
  FILL: 'positive',
  PARTIAL_FILL: 'warning',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
  EXPIRED: 'neutral',
  SUSPENDED: 'warning',
  RESUMED: 'info',
};

function num(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

function price(value?: number): string {
  return value === undefined ? '—' : value.toFixed(2);
}

function dt(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function dateOnly(iso?: string): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

export function statusVm(status: OrderStatus): StatusVm {
  return { value: status, label: describeStatus(status).label, tone: STATUS_TONE[status] };
}

function sideVm(side: Order['side']): StatusVm {
  return {
    value: side,
    label: side === 'BUY' ? 'Buy' : 'Sell',
    tone: side === 'BUY' ? 'positive' : 'danger',
  };
}

function modeVm(mode: ExecutionMode): StatusVm {
  return {
    value: mode,
    label: mode.charAt(0) + mode.slice(1).toLowerCase(),
    tone: MODE_TONE[mode],
  };
}

export function toRowVm(order: Order): OrderRowVm {
  return {
    id: order.id,
    clientOrderId: order.clientOrderId,
    symbol: order.symbol,
    side: sideVm(order.side),
    type: describeOrderType(order.type).label,
    quantity: num(order.quantity),
    filled: num(order.execution.filledQuantity),
    remaining: num(order.execution.remainingQuantity),
    avgPrice: price(order.execution.averagePrice),
    status: statusVm(order.status),
    suspended: order.suspended,
    mode: modeVm(order.mode),
    updatedLabel: dt(order.updatedAt),
  };
}

export function toEventVm(event: OrderEvent): EventVm {
  return {
    id: event.id,
    type: event.type.replace(/_/g, ' '),
    status: event.status ? statusVm(event.status) : undefined,
    message: event.message,
    actor: event.actor,
    atLabel: dt(event.at),
    tone: EVENT_TONE[event.type] ?? 'info',
  };
}

function toStateVm(state: OrderState): StateVm {
  return { status: statusVm(state.status), atLabel: dt(state.at), note: state.note };
}

export function toAuditVm(entry: Order['audit'][number]): AuditVm {
  return {
    id: entry.id,
    actor: entry.actor,
    action: entry.action.replace(/_/g, ' '),
    detail: entry.detail,
    atLabel: dt(entry.at),
  };
}

function toApprovalVm(approval: OrderApproval): ApprovalVm {
  return {
    id: approval.id,
    role: approval.role,
    status: {
      value: approval.status,
      label: APPROVAL_LABEL[approval.status],
      tone: APPROVAL_TONE[approval.status],
    },
    decidedBy: approval.decidedBy,
    decidedLabel: dateOnly(approval.decidedAt),
    rationale: approval.rationale,
  };
}

function toFillVm(fill: OrderFill): FillVm {
  return {
    id: fill.id,
    quantity: num(fill.quantity),
    price: fill.price.toFixed(2),
    liquidity: fill.liquidity,
    venue: fill.venue,
    atLabel: dt(fill.at),
  };
}

function toRouteVm(route: OrderRoute): RouteVm {
  return {
    venue: route.venue,
    destination: route.destination,
    mode: modeVm(route.mode),
    gatewayRef: route.gatewayRef,
    routedLabel: route.routedAt ? dt(route.routedAt) : undefined,
  };
}

function toCheckVm(check: { id: string; label: string; passed: boolean; detail: string }): CheckVm {
  return {
    id: check.id,
    label: check.label,
    status: {
      value: String(check.passed),
      label: check.passed ? 'Pass' : 'Fail',
      tone: check.passed ? 'positive' : 'danger',
    },
    detail: check.detail,
  };
}

function toActionVms(order: Order): ActionVm[] {
  const permitted = new Set(permittedActions(order.status, order.suspended));
  return (['amend', 'replace', 'suspend', 'resume', 'cancel', 'retry'] as const).map((action) => ({
    action,
    label: describeAction(action).label,
    permitted: permitted.has(action),
  }));
}

export function toDetailVm(order: Order): OrderDetailVm {
  const type = describeOrderType(order.type);
  return {
    id: order.id,
    clientOrderId: order.clientOrderId,
    symbol: order.symbol,
    side: sideVm(order.side),
    type: order.type,
    typeLabel: type.label,
    status: statusVm(order.status),
    suspended: order.suspended,
    mode: modeVm(order.mode),
    version: order.version,
    quantity: num(order.quantity),
    filled: num(order.execution.filledQuantity),
    remaining: num(order.execution.remainingQuantity),
    avgPrice: price(order.execution.averagePrice),
    limitPrice: price(order.limitPrice),
    stopPrice: price(order.stopPrice),
    timeInForce: order.timeInForce,
    fillPercent: Math.round(fillRatio(order.quantity, order.execution.filledQuantity) * 100),
    fillPercentLabel: `${Math.round(fillRatio(order.quantity, order.execution.filledQuantity) * 100)}%`,
    validation: {
      value: order.validation.status,
      label: VALIDATION_LABEL[order.validation.status],
      tone: VALIDATION_TONE[order.validation.status],
    },
    validationChecks: order.validation.checks.map(toCheckVm),
    approvals: order.approvals.map(toApprovalVm),
    route: order.route ? toRouteVm(order.route) : undefined,
    fills: order.execution.fills.map(toFillVm),
    events: order.events.map(toEventVm),
    states: order.states.map(toStateVm),
    audit: [...order.audit].reverse().map(toAuditVm),
    actions: toActionVms(order),
    metadata: [
      { label: 'Source', value: order.metadata.source },
      { label: 'Strategy', value: order.metadata.strategyId ?? '—' },
      { label: 'Portfolio', value: order.metadata.portfolioId ?? '—' },
      { label: 'Signal', value: order.metadata.signalId ?? '—' },
      { label: 'Optimization run', value: order.metadata.optimizationRunId ?? '—' },
      { label: 'Account', value: order.account },
      { label: 'Time in force', value: order.timeInForce },
      ...order.metadata.entries.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
    tags: order.tags,
    owner: order.owner,
    createdLabel: dt(order.createdAt),
    updatedLabel: dt(order.updatedAt),
  };
}

function bucket(status: OrderStatus, count: number): StatusBucketVm {
  return { label: describeStatus(status).label, count, tone: STATUS_TONE[status] };
}

export function toMetricsVm(metrics: OrderMetrics): MetricsVm {
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  return {
    total: metrics.total,
    active: metrics.active,
    working: metrics.working,
    filled: metrics.filled,
    partiallyFilled: metrics.partiallyFilled,
    rejected: metrics.rejected,
    cancelled: metrics.cancelled,
    expired: metrics.expired,
    suspended: metrics.suspended,
    fillRate: pct(metrics.fillRate),
    rejectRate: pct(metrics.rejectRate),
    cancelRate: pct(metrics.cancelRate),
    fillCompletion: pct(metrics.fillCompletion),
    byStatus: metrics.byStatus.map((entry) => bucket(entry.status, entry.count)),
  };
}

export function toHealthVm(health: OrderHealth): HealthVm {
  return {
    status: {
      value: health.status,
      label: health.status.charAt(0) + health.status.slice(1).toLowerCase(),
      tone: HEALTH_TONE[health.status],
    },
    checks: health.checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: {
        value: check.status,
        label: check.status.charAt(0) + check.status.slice(1).toLowerCase(),
        tone: HEALTH_TONE[check.status],
      },
      detail: check.detail,
    })),
  };
}

export function toReplayVm(order: Order, result: ReplayResult): ReplayVm {
  return {
    orderId: order.id,
    clientOrderId: order.clientOrderId,
    reconstructedStatus: statusVm(result.reconstructedStatus),
    recordedStatus: statusVm(result.recordedStatus),
    consistent: result.consistent,
    steps: result.steps.map((step) => ({
      index: step.index,
      type: step.type.replace(/_/g, ' '),
      from: statusVm(step.from),
      to: statusVm(step.to),
      legal: step.legal,
      actor: step.actor,
      atLabel: dt(step.at),
      message: step.message,
    })),
  };
}

export function toSummaryVm(orders: readonly Order[]): OrdersSummaryVm {
  const metrics = computeMetrics(orders);
  return {
    total: metrics.total,
    active: metrics.active,
    working: metrics.working,
    completed: orders.filter((o) => describeStatus(o.status).terminal).length,
    filled: metrics.filled,
    rejected: metrics.rejected,
    cancelled: metrics.cancelled,
    byStatus: metrics.byStatus.map((entry) => bucket(entry.status, entry.count)),
  };
}

export { computeMetrics, computeHealth, replay };
