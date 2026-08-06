/**
 * Pure Signal Engine domain derivations. Deterministic, no IO, no alpha model, no
 * signal computation, no statistics. These back the quality-status, health,
 * versioning and queue capabilities.
 */
import {
  compareVersions,
  isProductionEligible,
  type HealthStatus,
  type QualityGrade,
  type RegisteredSignal,
  type SignalStage,
  type SignalVersion,
  type SyncStatus,
} from '@platform/signal-sdk';
import { isEligibleForPromotion, isAwaitingApprovalDecision } from './lifecycle';

/** Deterministic quality grade from coverage/stability (lower of the two). */
export function qualityGrade(coverage: number, stability: number): QualityGrade {
  const worst = Math.min(coverage, stability);
  if (worst >= 0.99) return 'PASS';
  if (worst >= 0.95) return 'WARN';
  return 'FAIL';
}

/** Health derived from lifecycle stage and quality grade. */
export function deriveHealth(stage: SignalStage, quality: QualityGrade): HealthStatus {
  if (stage === 'CANDIDATE') return 'UNKNOWN';
  if (quality === 'FAIL') return 'DEGRADED';
  if (quality === 'WARN') return 'STALE';
  return isProductionEligible(stage) || stage === 'REGISTRY' ? 'HEALTHY' : 'STALE';
}

/** The current recommended version — newest by semantic order. */
export function currentVersion(signal: RegisteredSignal): SignalVersion | null {
  return signal.versions.reduce<SignalVersion | null>((best, candidate) => {
    if (!best) return candidate;
    return compareVersions(candidate.version, best.version) > 0 ? candidate : best;
  }, null);
}

export function isSyncHealthy(status: SyncStatus): boolean {
  return status === 'SYNCED';
}

/** Signals queued for promotion to a production candidate. */
export function promotionQueue(signals: readonly RegisteredSignal[]): RegisteredSignal[] {
  return signals.filter(
    (signal) => signal.promotion.status === 'QUEUED' || isEligibleForPromotion(signal),
  );
}

/** Signals awaiting a governance approval decision. */
export function approvalQueue(signals: readonly RegisteredSignal[]): RegisteredSignal[] {
  return signals.filter((signal) => isAwaitingApprovalDecision(signal));
}
