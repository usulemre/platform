/**
 * Shared status / coverage / quality / session vocabularies for the market-data
 * platform, used identically across the service and its administration UI.
 */
export type DatasetStatus = 'ACTIVE' | 'STALE' | 'EMPTY' | 'DEPRECATED';

export type CoverageStatus = 'COMPLETE' | 'PARTIAL' | 'SPARSE' | 'MISSING';

export type QualityGrade = 'PASS' | 'WARN' | 'FAIL';

export type SessionState = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET' | 'HOLIDAY';

/** A session in which orders can be worked. */
export function isTradeable(state: SessionState): boolean {
  return state === 'OPEN';
}

/** A dataset that can currently serve reads. */
export function isServable(status: DatasetStatus): boolean {
  return status === 'ACTIVE' || status === 'STALE';
}
