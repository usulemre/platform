/**
 * Pure market-data domain derivations. Deterministic, no IO, no time access.
 * These back the coverage, quality-validation and dataset-versioning capabilities.
 */
import type { CoverageStatus, DatasetVersion, QualityGrade } from '@platform/market-data-sdk';

/** Coverage status from a completeness fraction (0..1) and a gap count. */
export function coverageStatus(completeness: number, gaps: number): CoverageStatus {
  if (completeness <= 0) return 'MISSING';
  if (completeness >= 0.999 && gaps === 0) return 'COMPLETE';
  if (completeness >= 0.95) return 'PARTIAL';
  return 'SPARSE';
}

/** Deterministic quality grade from completeness/validity (lower of the two). */
export function qualityGrade(completeness: number, validity: number): QualityGrade {
  const worst = Math.min(completeness, validity);
  if (worst >= 0.99) return 'PASS';
  if (worst >= 0.95) return 'WARN';
  return 'FAIL';
}

/** The latest dataset version by `createdAt` (ISO-8601 lexical order). Pure. */
export function latestVersion(versions: readonly DatasetVersion[]): DatasetVersion | null {
  return versions.reduce<DatasetVersion | null>((latest, candidate) => {
    if (!latest) return candidate;
    return candidate.createdAt > latest.createdAt ? candidate : latest;
  }, null);
}
