/**
 * The **execution policy framework** — REAL, deterministic policy evaluators, one per policy type.
 * Each evaluates a configured `ExecutionPolicy` against an execution context and returns a
 * `PolicyEvaluation` (whether it permits the execution to proceed now, and its decision). Pure and
 * deterministic; time is taken from the injected context, never the wall-clock. No IO, no execution.
 */
import {
  describePolicy,
  venueForMode,
  type ExecutionMode,
  type ExecutionPolicy,
  type PolicyEvaluation,
} from '@platform/execution-engine-sdk';

export interface PolicyContext {
  /** The decision-moment ISO timestamp (injected). */
  readonly now: string;
  readonly mode: ExecutionMode;
  /** Whether the Risk Engine approved this execution (decided elsewhere). */
  readonly riskApproved: boolean;
  /** Attempts already made (for the retry policy). */
  readonly attempts: number;
  readonly quantity: number;
}

function param(policy: ExecutionPolicy, name: string): number {
  const provided = policy.params[name];
  if (provided !== undefined) return provided;
  return describePolicy(policy.type).params.find((p) => p.name === name)?.defaultValue ?? 0;
}

/** Minute-of-day from an ISO timestamp (UTC), 0..1439. Deterministic string parse. */
export function minuteOfDay(iso: string): number {
  const hh = Number(iso.slice(11, 13));
  const mm = Number(iso.slice(14, 16));
  return hh * 60 + mm;
}

/** Evaluate a single policy against the context. */
export function evaluatePolicy(policy: ExecutionPolicy, ctx: PolicyContext): PolicyEvaluation {
  switch (policy.type) {
    case 'IMMEDIATE':
      return {
        type: policy.type,
        allow: true,
        decision: 'immediate',
        detail: 'Route to the venue as soon as validated.',
      };
    case 'SCHEDULED': {
      const delay = param(policy, 'delayMinutes');
      return {
        type: policy.type,
        allow: true,
        decision: `scheduled +${delay}m`,
        detail: `Release ${delay} minutes after planning.`,
      };
    }
    case 'TIME_WINDOW': {
      const start = param(policy, 'startMinute');
      const end = param(policy, 'endMinute');
      const nowMin = minuteOfDay(ctx.now);
      const inWindow = nowMin >= start && nowMin <= end;
      return {
        type: policy.type,
        allow: inWindow,
        decision: inWindow ? 'in-window' : 'out-of-window',
        detail: `Window ${start}–${end} min-of-day; now ${nowMin}.`,
      };
    }
    case 'PARTIAL': {
      const slices = param(policy, 'sliceCount');
      return {
        type: policy.type,
        allow: true,
        decision: `slice ×${slices}`,
        detail: `Split into ${slices} child executions.`,
      };
    }
    case 'RETRY': {
      const max = param(policy, 'maxAttempts');
      const allow = ctx.attempts <= max;
      return {
        type: policy.type,
        allow,
        decision: `retry ≤ ${max}`,
        detail: `Attempt ${ctx.attempts} of ${max}.`,
      };
    }
    case 'TIMEOUT': {
      const timeout = param(policy, 'timeoutSeconds');
      return {
        type: policy.type,
        allow: true,
        decision: `timeout ${timeout}s`,
        detail: `Fail if not complete within ${timeout}s.`,
      };
    }
    case 'PRIORITY': {
      const priority = param(policy, 'priority');
      return {
        type: policy.type,
        allow: true,
        decision: `priority ${priority}`,
        detail: `Queue priority ${priority}.`,
      };
    }
    case 'THROTTLING': {
      const rate = param(policy, 'perMinute');
      return {
        type: policy.type,
        allow: true,
        decision: `throttle ${rate}/min`,
        detail: `Cap child executions at ${rate}/min.`,
      };
    }
    case 'VENUE_SELECTION': {
      const venue = venueForMode(ctx.mode);
      return {
        type: policy.type,
        allow: true,
        decision: `venue ${venue.id}`,
        detail: `Route to ${venue.label} (${ctx.mode.toLowerCase()}).`,
      };
    }
    case 'RISK_VALIDATION':
      return {
        type: policy.type,
        allow: ctx.riskApproved,
        decision: ctx.riskApproved ? 'risk-approved' : 'risk-blocked',
        detail: ctx.riskApproved
          ? 'Pre-execution risk approval present.'
          : 'Blocked: no risk approval.',
      };
  }
}

/** Evaluate all enabled policies of an execution against the context. */
export function evaluatePolicies(
  policies: readonly ExecutionPolicy[],
  ctx: PolicyContext,
): PolicyEvaluation[] {
  return policies.filter((policy) => policy.enabled).map((policy) => evaluatePolicy(policy, ctx));
}

/** Whether the evaluated policies permit the execution to proceed (the gate). */
export function policiesAllow(evaluations: readonly PolicyEvaluation[]): boolean {
  return evaluations.every((evaluation) => evaluation.allow);
}
