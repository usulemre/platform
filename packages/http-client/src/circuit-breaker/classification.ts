/**
 * Failure classification — decides whether a completed outcome counts as a `success`, a `failure`, or
 * is `ignored` for circuit-health purposes, per the policy. It reuses the canonical `classifyOutcome`
 * from the Retry & Timeout Engine and layers the circuit policy's category rules on top. Ignored
 * outcomes (validation, auth/authorization → client 4xx, business errors, aborts) never move the
 * circuit; failures (network, timeout, 5xx, optionally 429) do.
 */
import { classifyOutcome, type RetryCategory, type RetryOutcome } from '../retry/classify';
import type { CircuitPolicy } from './policy';

export type FailureVerdict = 'success' | 'failure' | 'ignored';

export function classifyForCircuit(outcome: RetryOutcome, policy: CircuitPolicy): FailureVerdict {
  const { category } = classifyOutcome(outcome);
  if (category === 'success') return 'success';
  if (policy.ignoreCategories.includes(category)) return 'ignored';
  if (category === 'rate-limit') return policy.includeRateLimit ? 'failure' : 'ignored';
  if (isFailureCategory(category, policy)) return 'failure';
  return 'ignored';
}

function isFailureCategory(category: RetryCategory, policy: CircuitPolicy): boolean {
  return policy.failureCategories.includes(category);
}
