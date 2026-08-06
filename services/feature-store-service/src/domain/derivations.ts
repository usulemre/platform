/**
 * Pure Feature Store domain derivations. Deterministic, no IO, no feature
 * computation. These back the quality-status, health and versioning capabilities.
 */
import {
  compareVersions,
  isCurrent,
  type FeatureLifecycleStatus,
  type FeatureVersion,
  type HealthStatus,
  type QualityGrade,
  type RegisteredFeature,
  type SyncStatus,
} from '@platform/feature-store-sdk';

/** Deterministic quality grade from completeness/stability (lower of the two). */
export function qualityGrade(completeness: number, stability: number): QualityGrade {
  const worst = Math.min(completeness, stability);
  if (worst >= 0.99) return 'PASS';
  if (worst >= 0.95) return 'WARN';
  return 'FAIL';
}

/** Health derived from lifecycle status and quality grade. */
export function deriveHealth(status: FeatureLifecycleStatus, quality: QualityGrade): HealthStatus {
  if (status === 'RETIRED') return 'UNKNOWN';
  if (quality === 'FAIL') return 'DEGRADED';
  if (status === 'DEPRECATED' || quality === 'WARN') return 'STALE';
  return 'HEALTHY';
}

/** The current recommended version — newest APPROVED version, else newest. */
export function currentVersion(feature: RegisteredFeature): FeatureVersion | null {
  const pick = (list: readonly FeatureVersion[]): FeatureVersion | null =>
    list.reduce<FeatureVersion | null>((best, candidate) => {
      if (!best) return candidate;
      return compareVersions(candidate.version, best.version) > 0 ? candidate : best;
    }, null);
  const approved = feature.versions.filter((version) => isCurrent(version.status));
  return pick(approved.length > 0 ? approved : feature.versions);
}

export function isSyncHealthy(status: SyncStatus): boolean {
  return status === 'SYNCED';
}
