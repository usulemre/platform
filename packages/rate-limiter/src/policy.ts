/**
 * `RateLimitPolicy` — the immutable, declarative configuration of a rate limiter: which algorithm to
 * use, its rate parameters, the concurrency cap, the queue/backpressure limits, the default weight and
 * the scope it applies to. Policies are provider-independent data; a limiter interprets one
 * deterministically. `createAlgorithm` materializes the chosen algorithm.
 */
import {
  FixedWindowLimiter,
  LeakyBucketLimiter,
  SlidingWindowLimiter,
  TokenBucketLimiter,
  type RateLimitAlgorithm,
  type RateLimitAlgorithmName,
  type RateLimitParams,
} from './algorithms';

/** The scopes a limit can be keyed by (from broadest to narrowest). */
export type RateLimitScope =
  | 'GLOBAL'
  | 'PROVIDER'
  | 'ACCOUNT'
  | 'API_KEY'
  | 'ENDPOINT'
  | 'SYMBOL'
  | 'REQUEST_TYPE';

export const RATE_LIMIT_SCOPES: readonly RateLimitScope[] = [
  'GLOBAL',
  'PROVIDER',
  'ACCOUNT',
  'API_KEY',
  'ENDPOINT',
  'SYMBOL',
  'REQUEST_TYPE',
];

export interface RateLimitPolicy {
  readonly name: string;
  readonly scope: RateLimitScope;
  readonly algorithm: RateLimitAlgorithmName;
  readonly params: RateLimitParams;
  /** Maximum concurrent in-flight permits (0 = unlimited). */
  readonly maxConcurrent: number;
  /** Maximum queued waiters before backpressure rejects (0 = unbounded). */
  readonly maxQueue: number;
  /** Default maximum time a waiter will wait before being rejected (ms; 0 = wait indefinitely). */
  readonly maxWaitMs: number;
  /** Default permit weight for a request. */
  readonly defaultWeight: number;
}

export interface RateLimitPolicyInit {
  readonly name?: string;
  readonly scope?: RateLimitScope;
  readonly algorithm?: RateLimitAlgorithmName;
  readonly params?: RateLimitParams;
  readonly maxConcurrent?: number;
  readonly maxQueue?: number;
  readonly maxWaitMs?: number;
  readonly defaultWeight?: number;
}

/** Build a rate-limit policy from a partial specification, filling canonical defaults. */
export function createRateLimitPolicy(init: RateLimitPolicyInit = {}): RateLimitPolicy {
  return {
    name: init.name ?? 'default',
    scope: init.scope ?? 'PROVIDER',
    algorithm: init.algorithm ?? 'token-bucket',
    params: init.params ?? { limit: 10, intervalMs: 1000 },
    maxConcurrent: init.maxConcurrent ?? 0,
    maxQueue: init.maxQueue ?? 1000,
    maxWaitMs: init.maxWaitMs ?? 0,
    defaultWeight: init.defaultWeight ?? 1,
  };
}

export const DEFAULT_RATE_LIMIT_POLICY: RateLimitPolicy = createRateLimitPolicy();

/** Materialize the algorithm described by a policy, seeded at `now`. */
export function createAlgorithm(policy: RateLimitPolicy, now: number): RateLimitAlgorithm {
  switch (policy.algorithm) {
    case 'token-bucket':
      return new TokenBucketLimiter(policy.params, now);
    case 'leaky-bucket':
      return new LeakyBucketLimiter(policy.params, now);
    case 'fixed-window':
      return new FixedWindowLimiter(policy.params, now);
    case 'sliding-window':
      return new SlidingWindowLimiter(policy.params);
    default: {
      const exhaustive: never = policy.algorithm;
      return exhaustive;
    }
  }
}
