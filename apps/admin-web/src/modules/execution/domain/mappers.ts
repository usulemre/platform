/**
 * DTO → view-model mappings for the Execution module. All presentation decisions live here so
 * components stay logic-free. Pure and deterministic. Status/policy/venue labels and the action
 * predicates come from `@platform/execution-engine-sdk`; quantities and prices are formatted, never
 * computed (executed/remaining/average come from the execution's own result record).
 */
import {
  POLICY_CATALOG,
  VENUES,
  describeAction,
  describePolicy,
  describeStatus,
  executionProgress,
  permittedActions,
  type Execution,
  type ExecutionMode,
  type ExecutionPlan,
  type ExecutionPolicy,
  type ExecutionSession,
  type ExecutionStatus,
  type PolicyEvaluation,
} from '@platform/execution-engine-sdk';
import {
  computeHealth,
  computeMetrics,
  replay,
  type ExecutionHealth,
  type HealthStatus,
  type ReplayResult,
} from './derive';
import type { PlanPreview } from '../data/planner';
import type {
  ActionVm,
  CheckVm,
  EventVm,
  ExecutionDetailVm,
  ExecutionRowVm,
  ExecutionSummaryVm,
  HealthVm,
  MetricsVm,
  PlanPreviewVm,
  PlanVm,
  PolicyDescriptorVm,
  PolicyEvalVm,
  PolicyRefVm,
  ReplayVm,
  SessionVm,
  StatusBucketVm,
  StatusVm,
  Tone,
  VenueVm,
} from './view-model';
import type { ExecutionMetrics } from '@platform/execution-engine-sdk';

const STATUS_TONE: Record<ExecutionStatus, Tone> = {
  ORDER_RECEIVED: 'neutral',
  EXECUTION_PLANNED: 'info',
  EXECUTION_VALIDATED: 'info',
  WAITING_FOR_VENUE: 'info',
  EXECUTING: 'warning',
  PARTIALLY_EXECUTED: 'warning',
  COMPLETED: 'positive',
  CANCELLED: 'neutral',
  FAILED: 'danger',
};
const MODE_TONE: Record<ExecutionMode, Tone> = {
  SIMULATED: 'info',
  PAPER: 'neutral',
  LIVE: 'danger',
};
const HEALTH_TONE: Record<HealthStatus, Tone> = {
  HEALTHY: 'positive',
  DEGRADED: 'warning',
  UNHEALTHY: 'danger',
};
const EVENT_TONE: Record<string, Tone> = {
  COMPLETED: 'positive',
  SLICE_EXECUTED: 'warning',
  PARTIALLY_EXECUTED: 'warning',
  FAILED: 'danger',
  CANCELLED: 'neutral',
  PAUSED: 'warning',
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

export function statusVm(status: ExecutionStatus): StatusVm {
  return { value: status, label: describeStatus(status).label, tone: STATUS_TONE[status] };
}
function sideVm(side: Execution['side']): StatusVm {
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

export function toRowVm(execution: Execution): ExecutionRowVm {
  return {
    id: execution.id,
    clientOrderId: execution.clientOrderId,
    symbol: execution.symbol,
    side: sideVm(execution.side),
    quantity: num(execution.quantity),
    executed: num(execution.result.executedQuantity),
    remaining: num(execution.result.remainingQuantity),
    avgPrice: price(execution.result.averagePrice),
    status: statusVm(execution.status),
    paused: execution.paused,
    mode: modeVm(execution.mode),
    venue: execution.plan?.venue ?? '—',
    updatedLabel: dt(execution.updatedAt),
  };
}

function evalVm(evaluation: PolicyEvaluation): PolicyEvalVm {
  return {
    type: evaluation.type,
    allow: evaluation.allow,
    decision: evaluation.decision,
    detail: evaluation.detail,
  };
}
function planVm(plan: ExecutionPlan): PlanVm {
  return {
    strategy: plan.strategy,
    venue: plan.venue,
    mode: modeVm(plan.mode),
    sliceCount: plan.sliceCount,
    sliceQuantity: num(plan.sliceQuantity),
    priority: plan.priority,
    retryLimit: plan.retryLimit,
    timeoutSeconds: plan.timeoutSeconds,
    throttlePerMinute: plan.throttlePerMinute,
    releaseLabel: plan.releaseAt ? dt(plan.releaseAt) : undefined,
    note: plan.note,
    evaluations: plan.policyEvaluations.map(evalVm),
  };
}
function policyRefVm(policy: ExecutionPolicy): PolicyRefVm {
  const entries = Object.entries(policy.params);
  return {
    type: policy.type,
    label: describePolicy(policy.type).label,
    enabled: policy.enabled,
    params: entries.length === 0 ? '—' : entries.map(([k, v]) => `${k}=${v}`).join(', '),
  };
}
function toEventVm(event: Execution['events'][number]): EventVm {
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
function toActionVms(execution: Execution): ActionVm[] {
  const permitted = new Set(permittedActions(execution.status, execution.paused));
  return (['retry', 'pause', 'resume', 'cancel', 'replay'] as const).map((action) => ({
    action,
    label: describeAction(action).label,
    permitted: permitted.has(action),
  }));
}

export function toDetailVm(execution: Execution): ExecutionDetailVm {
  const progress = executionProgress(execution.quantity, execution.result.executedQuantity);
  return {
    id: execution.id,
    clientOrderId: execution.clientOrderId,
    orderId: execution.orderId,
    symbol: execution.symbol,
    side: sideVm(execution.side),
    status: statusVm(execution.status),
    paused: execution.paused,
    mode: modeVm(execution.mode),
    quantity: num(execution.quantity),
    executed: num(execution.result.executedQuantity),
    remaining: num(execution.result.remainingQuantity),
    avgPrice: price(execution.result.averagePrice),
    progressPercent: Math.round(progress * 100),
    progressLabel: `${Math.round(progress * 100)}%`,
    validation: {
      value: execution.validation.status,
      label: execution.validation.status.replace('_', ' '),
      tone:
        execution.validation.status === 'PASSED'
          ? 'positive'
          : execution.validation.status === 'FAILED'
            ? 'danger'
            : execution.validation.status === 'PENDING'
              ? 'warning'
              : 'neutral',
    },
    validationChecks: execution.validation.checks.map(toCheckVm),
    plan: execution.plan ? planVm(execution.plan) : undefined,
    policies: execution.policies.map(policyRefVm),
    tasks: execution.tasks.map((task) => ({
      id: task.id,
      sliceIndex: task.sliceIndex,
      quantity: num(task.quantity),
      status: statusVm(task.status),
      venue: task.venue,
    })),
    slices: execution.result.slices.map((s) => ({
      taskId: s.taskId,
      quantity: num(s.quantity),
      price: s.price.toFixed(2),
      venue: s.venue,
      atLabel: dt(s.at),
    })),
    events: execution.events.map(toEventVm),
    states: execution.states.map((s) => ({
      status: statusVm(s.status),
      atLabel: dt(s.at),
      note: s.note,
    })),
    audit: [...execution.audit]
      .reverse()
      .map((entry) => ({
        id: entry.id,
        actor: entry.actor,
        action: entry.action.replace(/_/g, ' '),
        detail: entry.detail,
        atLabel: dt(entry.at),
      })),
    actions: toActionVms(execution),
    metadata: [
      { label: 'Order', value: execution.clientOrderId },
      { label: 'Order id', value: execution.orderId },
      { label: 'Source', value: execution.metadata.source },
      { label: 'Strategy', value: execution.metadata.strategyId ?? '—' },
      { label: 'Portfolio', value: execution.metadata.portfolioId ?? '—' },
      { label: 'Session', value: execution.sessionId ?? '—' },
      { label: 'Venue', value: execution.result.venue || '—' },
      ...execution.metadata.entries.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
    tags: execution.tags,
    createdLabel: dt(execution.createdAt),
    updatedLabel: dt(execution.updatedAt),
  };
}

function bucket(status: ExecutionStatus, count: number): StatusBucketVm {
  return { label: describeStatus(status).label, count, tone: STATUS_TONE[status] };
}
export function toMetricsVm(metrics: ExecutionMetrics): MetricsVm {
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  return {
    total: metrics.total,
    active: metrics.active,
    working: metrics.working,
    completed: metrics.completed,
    failed: metrics.failed,
    cancelled: metrics.cancelled,
    partiallyExecuted: metrics.partiallyExecuted,
    paused: metrics.paused,
    completionRate: pct(metrics.completionRate),
    failRate: pct(metrics.failRate),
    fillCompletion: pct(metrics.fillCompletion),
    averageSlices: metrics.averageSlices.toFixed(2),
    byStatus: metrics.byStatus.map((entry) => bucket(entry.status, entry.count)),
  };
}
export function toHealthVm(health: ExecutionHealth): HealthVm {
  const s = (status: HealthStatus): StatusVm => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
    tone: HEALTH_TONE[status],
  });
  return {
    status: s(health.status),
    checks: health.checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: s(check.status),
      detail: check.detail,
    })),
  };
}
export function toReplayVm(execution: Execution, result: ReplayResult): ReplayVm {
  return {
    executionId: execution.id,
    clientOrderId: execution.clientOrderId,
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
export function toSummaryVm(executions: readonly Execution[]): ExecutionSummaryVm {
  const metrics = computeMetrics(executions);
  return {
    total: metrics.total,
    active: metrics.active,
    working: metrics.working,
    completed: metrics.completed,
    failed: metrics.failed,
    cancelled: metrics.cancelled,
    byStatus: metrics.byStatus.map((entry) => bucket(entry.status, entry.count)),
  };
}
export function toSessionVm(session: ExecutionSession): SessionVm {
  return {
    id: session.id,
    label: session.label,
    mode: modeVm(session.mode),
    status: {
      value: session.status,
      label: session.status.charAt(0) + session.status.slice(1).toLowerCase(),
      tone:
        session.status === 'ACTIVE' ? 'positive' : session.status === 'CLOSED' ? 'neutral' : 'info',
    },
    executionCount: session.executionIds.length,
    openedLabel: dt(session.openedAt),
    note: session.note,
  };
}
export function policyCatalogVms(): PolicyDescriptorVm[] {
  return POLICY_CATALOG.map((policy) => ({
    type: policy.type,
    label: policy.label,
    description: policy.description,
    category: policy.category,
    params: policy.params.map((p) => ({
      name: p.name,
      label: p.label,
      defaultValue: p.defaultValue,
      unit: p.unit,
    })),
  }));
}
export function venueVms(): VenueVm[] {
  return VENUES.map((venue) => ({
    id: venue.id,
    label: venue.label,
    kind: venue.kind,
    mode: modeVm(venue.mode),
    description: venue.description,
  }));
}
export function toPlanPreviewVm(preview: PlanPreview): PlanPreviewVm {
  return {
    plan: planVm(preview.plan),
    tasks: preview.tasks.map((task) => ({
      id: task.id,
      sliceIndex: task.sliceIndex,
      quantity: num(task.quantity),
      status: statusVm(task.status),
      venue: task.venue,
    })),
    validationPassed: preview.validationPassed,
    checks: preview.checks.map(toCheckVm),
  };
}

export { computeMetrics, computeHealth, replay };
