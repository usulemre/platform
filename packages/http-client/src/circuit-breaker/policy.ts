/**
 * `CircuitPolicy` — the immutable, declarative configuration of a circuit breaker: the sliding-window
 * shape, the failure/success thresholds, the recovery timeout, the half-open trial limit, and the
 * failure-classification rules (which outcome categories count as failures vs are ignored). Policies
 * are provider-independent data; the breaker interprets them deterministically.
 */
import { CountSlidingWindow, TimeSlidingWindow, type SlidingWindow } from './window';
import type { RetryCategory } from '../retry/classify';

export interface SlidingWindowSpec {
  readonly type: 'count' | 'time';
  /** Number of outcomes (count) or duration in ms (time). */
  readonly size: number;
}

export interface CircuitPolicy {
  readonly name: string;
  /** Number of failures within the window that opens the circuit. */
  readonly failureThreshold: number;
  /** Optional failure-rate (0–1) that opens the circuit once `minimumThroughput` is met. */
  readonly failureRateThreshold?: number;
  /** Consecutive successes in HALF_OPEN required to close the circuit. */
  readonly successThreshold: number;
  /** How long the circuit stays OPEN before allowing a trial (ms). */
  readonly recoveryTimeoutMs: number;
  /** Maximum concurrent trial calls permitted while HALF_OPEN. */
  readonly halfOpenMaxCalls: number;
  /** Minimum recorded calls in the window before the failure rules are evaluated. */
  readonly minimumThroughput: number;
  readonly window: SlidingWindowSpec;
  /** Outcome categories that count as failures. */
  readonly failureCategories: readonly RetryCategory[];
  /** Outcome categories explicitly ignored (never affect the circuit). */
  readonly ignoreCategories: readonly RetryCategory[];
  /** Whether HTTP 429 (rate-limit) counts as a failure. */
  readonly includeRateLimit: boolean;
}

/** The categories that are, by default, treated as provider-health failures. */
export const DEFAULT_FAILURE_CATEGORIES: readonly RetryCategory[] = [
  'network',
  'timeout',
  'server',
];
/** The categories that are, by default, ignored (caller-side / business errors). */
export const DEFAULT_IGNORE_CATEGORIES: readonly RetryCategory[] = [
  'client',
  'validation',
  'aborted',
  'parse',
  'redirect',
];

export interface CircuitPolicyInit {
  readonly name?: string;
  readonly failureThreshold?: number;
  readonly failureRateThreshold?: number;
  readonly successThreshold?: number;
  readonly recoveryTimeoutMs?: number;
  readonly halfOpenMaxCalls?: number;
  readonly minimumThroughput?: number;
  readonly window?: SlidingWindowSpec;
  readonly failureCategories?: readonly RetryCategory[];
  readonly ignoreCategories?: readonly RetryCategory[];
  readonly includeRateLimit?: boolean;
}

/** Build a circuit policy from a partial specification, filling canonical defaults. */
export function createCircuitPolicy(init: CircuitPolicyInit = {}): CircuitPolicy {
  return {
    name: init.name ?? 'default',
    failureThreshold: init.failureThreshold ?? 5,
    failureRateThreshold: init.failureRateThreshold,
    successThreshold: init.successThreshold ?? 2,
    recoveryTimeoutMs: init.recoveryTimeoutMs ?? 30_000,
    halfOpenMaxCalls: init.halfOpenMaxCalls ?? 1,
    minimumThroughput: init.minimumThroughput ?? 5,
    window: init.window ?? { type: 'count', size: 20 },
    failureCategories: init.failureCategories ?? DEFAULT_FAILURE_CATEGORIES,
    ignoreCategories: init.ignoreCategories ?? DEFAULT_IGNORE_CATEGORIES,
    includeRateLimit: init.includeRateLimit ?? false,
  };
}

/** The canonical default circuit policy. */
export const DEFAULT_CIRCUIT_POLICY: CircuitPolicy = createCircuitPolicy();

/** Construct the sliding window described by a policy. */
export function createWindow(spec: SlidingWindowSpec): SlidingWindow {
  return spec.type === 'time'
    ? new TimeSlidingWindow(spec.size)
    : new CountSlidingWindow(spec.size);
}
