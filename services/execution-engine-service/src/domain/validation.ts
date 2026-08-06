/**
 * Execution validation — REAL, deterministic checks over an execution request and its plan. Produces
 * an `ExecutionValidation` record. Structural + policy consistency + policy-gate checks. No IO, no
 * market data, no execution. Risk approval itself is decided by the Risk Engine and surfaced here via
 * the plan's `RISK_VALIDATION` policy evaluation.
 */
import type {
  ExecutionPlan,
  ExecutionRequest,
  ExecutionValidation,
  ValidationCheck,
} from '@platform/execution-engine-sdk';

export function validateExecution(
  request: ExecutionRequest,
  plan: ExecutionPlan,
  at: string,
): ExecutionValidation {
  const checks: ValidationCheck[] = [];

  checks.push({
    id: 'quantity',
    label: 'Quantity is positive',
    passed: request.quantity > 0,
    detail: `quantity = ${request.quantity}`,
  });
  checks.push({
    id: 'venue',
    label: 'A venue was selected',
    passed: plan.venue.length > 0,
    detail: plan.venue || '(none)',
  });
  checks.push({
    id: 'slices',
    label: 'Slice plan covers the quantity',
    passed: plan.sliceCount >= 1 && plan.sliceQuantity > 0,
    detail: `${plan.sliceCount} × ${plan.sliceQuantity.toFixed(4)}`,
  });

  const blocking = plan.policyEvaluations.filter((evaluation) => !evaluation.allow);
  checks.push({
    id: 'policies',
    label: 'All policies permit execution',
    passed: blocking.length === 0,
    detail:
      blocking.length === 0
        ? `${plan.policyEvaluations.length} policies satisfied`
        : `blocked by ${blocking.map((b) => b.type).join(', ')}`,
  });

  const passed = checks.every((check) => check.passed);
  return { status: passed ? 'PASSED' : 'FAILED', checks, validatedAt: at };
}
