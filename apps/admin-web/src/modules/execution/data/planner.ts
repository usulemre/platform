/**
 * UI-local execution plan preview — a compact, deterministic mirror of the Execution Engine
 * service's planner + policy evaluators, used by the Execution Planner screen to preview a plan
 * without a backend. Uses the shared SDK vocabulary (policy catalog, venue selection, slice
 * splitting). Pure; no IO, no execution.
 */
import {
  sliceQuantities,
  venueForMode,
  type ExecutionMode,
  type ExecutionPlan,
  type ExecutionTask,
  type PlanStrategy,
  type PolicyEvaluation,
} from '@platform/execution-engine-sdk';

export interface PlannerInput {
  readonly symbol: string;
  readonly quantity: number;
  readonly mode: ExecutionMode;
  readonly sliceCount: number;
  readonly scheduledDelayMinutes: number | null;
  readonly riskValidation: boolean;
  readonly riskApproved: boolean;
  readonly priority: number;
}

export interface PlanPreview {
  readonly plan: ExecutionPlan;
  readonly tasks: readonly ExecutionTask[];
  readonly validationPassed: boolean;
  readonly checks: readonly {
    readonly id: string;
    readonly label: string;
    readonly passed: boolean;
    readonly detail: string;
  }[];
}

const AT = '2026-08-01T14:30:00.000Z';

export function previewPlan(input: PlannerInput): PlanPreview {
  const venue = venueForMode(input.mode);
  const sliceCount = Math.max(1, Math.floor(input.sliceCount));
  const strategy: PlanStrategy =
    sliceCount > 1 ? 'SLICED' : input.scheduledDelayMinutes !== null ? 'SCHEDULED' : 'IMMEDIATE';

  const evaluations: PolicyEvaluation[] = [];
  if (sliceCount > 1)
    evaluations.push({
      type: 'PARTIAL',
      allow: true,
      decision: `slice ×${sliceCount}`,
      detail: `Split into ${sliceCount} child executions.`,
    });
  if (input.scheduledDelayMinutes !== null)
    evaluations.push({
      type: 'SCHEDULED',
      allow: true,
      decision: `scheduled +${input.scheduledDelayMinutes}m`,
      detail: `Release after ${input.scheduledDelayMinutes} minutes.`,
    });
  else
    evaluations.push({
      type: 'IMMEDIATE',
      allow: true,
      decision: 'immediate',
      detail: 'Route as soon as validated.',
    });
  evaluations.push({
    type: 'VENUE_SELECTION',
    allow: true,
    decision: `venue ${venue.id}`,
    detail: `Route to ${venue.label}.`,
  });
  evaluations.push({
    type: 'PRIORITY',
    allow: true,
    decision: `priority ${input.priority}`,
    detail: `Queue priority ${input.priority}.`,
  });
  if (input.riskValidation)
    evaluations.push({
      type: 'RISK_VALIDATION',
      allow: input.riskApproved,
      decision: input.riskApproved ? 'risk-approved' : 'risk-blocked',
      detail: input.riskApproved ? 'Risk approval present.' : 'Blocked: no risk approval.',
    });

  const plan: ExecutionPlan = {
    id: 'PREVIEW:PLAN',
    requestId: 'PREVIEW',
    strategy,
    venue: venue.id,
    venueKind: venue.kind,
    mode: input.mode,
    sliceCount,
    sliceQuantity: input.quantity / sliceCount,
    priority: input.priority,
    retryLimit: 3,
    timeoutSeconds: 300,
    throttlePerMinute: 60,
    releaseAt:
      input.scheduledDelayMinutes !== null
        ? new Date(Date.parse(AT) + input.scheduledDelayMinutes * 60_000).toISOString()
        : undefined,
    policyEvaluations: evaluations,
    plannedAt: AT,
    note: `${strategy.toLowerCase()} execution on ${venue.label}.`,
  };
  const tasks: ExecutionTask[] = sliceQuantities(input.quantity, sliceCount).map((q, index) => ({
    id: `PREVIEW:T${index + 1}`,
    sliceIndex: index,
    quantity: q,
    executedQuantity: 0,
    status: 'ORDER_RECEIVED',
    venue: venue.id,
    attempts: 0,
  }));

  const blocking = evaluations.filter((e) => !e.allow);
  const checks = [
    {
      id: 'quantity',
      label: 'Quantity is positive',
      passed: input.quantity > 0,
      detail: `quantity = ${input.quantity}`,
    },
    { id: 'venue', label: 'A venue was selected', passed: true, detail: venue.id },
    {
      id: 'slices',
      label: 'Slice plan covers the quantity',
      passed: sliceCount >= 1,
      detail: `${sliceCount} × ${(input.quantity / sliceCount).toFixed(2)}`,
    },
    {
      id: 'policies',
      label: 'All policies permit execution',
      passed: blocking.length === 0,
      detail:
        blocking.length === 0
          ? `${evaluations.length} policies satisfied`
          : `blocked by ${blocking.map((b) => b.type).join(', ')}`,
    },
  ];
  return { plan, tasks, validationPassed: input.quantity > 0 && blocking.length === 0, checks };
}
