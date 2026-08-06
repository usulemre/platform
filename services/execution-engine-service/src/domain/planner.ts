/**
 * The **Execution Planner** — produces a deterministic `ExecutionPlan` (and its child
 * `ExecutionTask` slices) from an `ExecutionRequest` and its policies. It selects the venue
 * (venue-selection policy), the scheduling strategy (immediate / scheduled / time-window / sliced),
 * the slice count/quantity (partial + throttling policies), priority, retry limit and timeout, and
 * records the policy evaluations. Pure and deterministic; time comes from the injected timestamp.
 */
import {
  describePolicy,
  sliceQuantities,
  venueForMode,
  type ExecutionPlan,
  type ExecutionPolicy,
  type ExecutionRequest,
  type ExecutionTask,
  type PlanStrategy,
} from '@platform/execution-engine-sdk';
import { evaluatePolicies, type PolicyContext } from './policy-evaluators';

function policyOf(
  request: ExecutionRequest,
  type: ExecutionPolicy['type'],
): ExecutionPolicy | undefined {
  return request.policies.find((policy) => policy.type === type && policy.enabled);
}

function param(policy: ExecutionPolicy | undefined, name: string, fallback: number): number {
  if (!policy) return fallback;
  const provided = policy.params[name];
  if (provided !== undefined) return provided;
  return describePolicy(policy.type).params.find((p) => p.name === name)?.defaultValue ?? fallback;
}

/** Build the execution plan for a request. */
export function planExecution(
  request: ExecutionRequest,
  ctx: PolicyContext,
  at: string,
): ExecutionPlan {
  const evaluations = evaluatePolicies(request.policies, ctx);

  const venue = venueForMode(request.mode);
  const partial = policyOf(request, 'PARTIAL');
  const scheduled = policyOf(request, 'SCHEDULED');
  const timeWindow = policyOf(request, 'TIME_WINDOW');
  const throttle = policyOf(request, 'THROTTLING');
  const retry = policyOf(request, 'RETRY');
  const timeout = policyOf(request, 'TIMEOUT');
  const priority = policyOf(request, 'PRIORITY');

  const sliceCount = Math.max(1, Math.floor(param(partial, 'sliceCount', 1)));
  const strategy: PlanStrategy = partial
    ? 'SLICED'
    : timeWindow
      ? 'TIME_WINDOW'
      : scheduled
        ? 'SCHEDULED'
        : 'IMMEDIATE';
  const releaseAt = scheduled
    ? new Date(Date.parse(at) + param(scheduled, 'delayMinutes', 15) * 60_000).toISOString()
    : undefined;

  const note =
    strategy === 'SLICED'
      ? `Sliced into ${sliceCount} child executions on ${venue.label}.`
      : strategy === 'SCHEDULED'
        ? `Scheduled release on ${venue.label}.`
        : strategy === 'TIME_WINDOW'
          ? `Time-window execution on ${venue.label}.`
          : `Immediate execution on ${venue.label}.`;

  return {
    id: `${request.id}:PLAN`,
    requestId: request.id,
    strategy,
    venue: venue.id,
    venueKind: venue.kind,
    mode: request.mode,
    sliceCount,
    sliceQuantity: request.quantity / sliceCount,
    priority: Math.round(param(priority, 'priority', request.priority)),
    retryLimit: Math.round(param(retry, 'maxAttempts', 0)),
    timeoutSeconds: Math.round(param(timeout, 'timeoutSeconds', 300)),
    throttlePerMinute: Math.round(param(throttle, 'perMinute', 60)),
    releaseAt,
    windowStartMinute: timeWindow ? Math.round(param(timeWindow, 'startMinute', 570)) : undefined,
    windowEndMinute: timeWindow ? Math.round(param(timeWindow, 'endMinute', 960)) : undefined,
    policyEvaluations: evaluations,
    plannedAt: at,
    note,
  };
}

/** Build the child execution tasks (slices) for a plan and quantity. */
export function planTasks(plan: ExecutionPlan, quantity: number): ExecutionTask[] {
  return sliceQuantities(quantity, plan.sliceCount).map((sliceQty, index) => ({
    id: `${plan.id}:T${index + 1}`,
    sliceIndex: index,
    quantity: sliceQty,
    executedQuantity: 0,
    status: 'ORDER_RECEIVED',
    venue: plan.venue,
    attempts: 0,
  }));
}
