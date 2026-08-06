/**
 * Backoff strategies — pure, deterministic functions that compute the delay before a retry. Each
 * strategy is a function of the 1-based retry `attempt`, the `previousDelayMs` (for stateful jitter)
 * and an injected `random` source (for jitter). Randomness is ALWAYS injected, never ambient, so a
 * seeded RNG yields identical results — the engine stays deterministic. Delays are non-negative and
 * capped by an optional `maxDelayMs`.
 */

/** An injected uniform random source in `[0, 1)`. */
export type Random = () => number;

export interface BackoffStrategy {
  readonly name: string;
  /** The delay (ms) before retry number `attempt` (1-based). */
  delay(attempt: number, previousDelayMs: number, random: Random): number;
}

function cap(value: number, maxDelayMs: number | undefined): number {
  const nonNegative = Math.max(0, value);
  return maxDelayMs === undefined ? nonNegative : Math.min(nonNegative, maxDelayMs);
}

/** A fixed delay for every attempt. */
export class ConstantBackoff implements BackoffStrategy {
  readonly name = 'constant';
  constructor(
    private readonly delayMs: number,
    private readonly maxDelayMs?: number,
  ) {}
  delay(): number {
    return cap(this.delayMs, this.maxDelayMs);
  }
}

/** A delay that grows linearly: `base + increment · (attempt − 1)`. */
export class LinearBackoff implements BackoffStrategy {
  readonly name = 'linear';
  constructor(
    private readonly baseMs: number,
    private readonly incrementMs: number = baseMs,
    private readonly maxDelayMs?: number,
  ) {}
  delay(attempt: number): number {
    return cap(this.baseMs + this.incrementMs * Math.max(0, attempt - 1), this.maxDelayMs);
  }
}

/** A delay that grows geometrically: `base · factor^(attempt − 1)`. */
export class ExponentialBackoff implements BackoffStrategy {
  readonly name = 'exponential';
  constructor(
    private readonly baseMs: number,
    private readonly factor: number = 2,
    private readonly maxDelayMs?: number,
  ) {}
  delay(attempt: number): number {
    return cap(this.baseMs * Math.pow(this.factor, Math.max(0, attempt - 1)), this.maxDelayMs);
  }
}

/**
 * AWS "decorrelated jitter": `min(cap, randomBetween(base, previousDelay · 3))`. Uses the previous
 * delay to spread retries and avoid thundering herds. The first attempt seeds from `base`.
 */
export class DecorrelatedJitter implements BackoffStrategy {
  readonly name = 'decorrelated-jitter';
  constructor(
    private readonly baseMs: number,
    private readonly maxDelayMs?: number,
  ) {}
  delay(_attempt: number, previousDelayMs: number, random: Random): number {
    const prev = previousDelayMs > 0 ? previousDelayMs : this.baseMs;
    const high = prev * 3;
    const value = this.baseMs + random() * Math.max(0, high - this.baseMs);
    return cap(value, this.maxDelayMs);
  }
}

/** Jitter mode applied on top of a base strategy. */
export type JitterMode = 'none' | 'full' | 'equal';

/**
 * Wrap a base strategy with jitter:
 * - `full`  → `random · base`            (uniform in `[0, base]`)
 * - `equal` → `base/2 + random · base/2` (uniform in `[base/2, base]`)
 */
export class JitterBackoff implements BackoffStrategy {
  readonly name: string;
  constructor(
    private readonly base: BackoffStrategy,
    private readonly mode: JitterMode,
  ) {
    this.name = `${base.name}+${mode}-jitter`;
  }
  delay(attempt: number, previousDelayMs: number, random: Random): number {
    const value = this.base.delay(attempt, previousDelayMs, random);
    if (this.mode === 'none') return value;
    if (this.mode === 'full') return random() * value;
    return value / 2 + random() * (value / 2);
  }
}

/** Apply jitter to a base strategy (a no-op for `none`). */
export function withJitter(base: BackoffStrategy, mode: JitterMode): BackoffStrategy {
  return mode === 'none' ? base : new JitterBackoff(base, mode);
}
