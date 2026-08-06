/**
 * Pure, deterministic pipeline primitives shared by the service and its UI.
 * No IO, no time access, no randomness (CS-3) — every input is explicit. These
 * back the Retry Policies, Deduplication and Quality Validation capabilities.
 */
import type { QualityGrade } from './statuses';

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly factor: number;
  readonly maxDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 1_000,
  factor: 2,
  maxDelayMs: 60_000,
};

/**
 * Exponential backoff delay for a given 1-based attempt number, clamped to
 * `maxDelayMs`. Attempt <= 0 yields 0. Pure.
 */
export function nextRetryDelayMs(
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): number {
  if (attempt <= 0) return 0;
  const raw = policy.baseDelayMs * Math.pow(policy.factor, attempt - 1);
  return Math.min(raw, policy.maxDelayMs);
}

/** True when a job has exhausted its retry budget and must be dead-lettered. */
export function shouldDeadLetter(
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): boolean {
  return attempt >= policy.maxAttempts;
}

/** Stable deduplication key from ordered parts (no hashing side effects). */
export function dedupKey(parts: readonly string[]): string {
  return parts.map((part) => part.trim()).join('|');
}

export interface QualityScore {
  /** 0..1 fraction of records passing all checks. */
  readonly completeness: number;
  /** 0..1 fraction free of anomalies. */
  readonly validity: number;
}

/**
 * Deterministic quality grade from a score. PASS ≥ 0.99, WARN ≥ 0.95, else FAIL.
 * Uses the lower of completeness/validity. Pure.
 */
export function qualityGrade(score: QualityScore): QualityGrade {
  const worst = Math.min(score.completeness, score.validity);
  if (worst >= 0.99) return 'PASS';
  if (worst >= 0.95) return 'WARN';
  return 'FAIL';
}
