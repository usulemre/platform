/**
 * Shared status / health / quality vocabularies for the ingestion pipeline.
 * These are the canonical enums used across the service and its administration
 * UI, so both tiers speak exactly the same language.
 */
export type PipelineStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DEGRADED' | 'FAILED' | 'RETIRED';

export type PipelineHealth = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'RETRYING' | 'DEAD_LETTER';

export type QualityGrade = 'PASS' | 'WARN' | 'FAIL';

/** A job is terminal when no further automatic transition will occur. */
export function isTerminalJob(status: JobStatus): boolean {
  return status === 'SUCCEEDED' || status === 'DEAD_LETTER';
}

/** A job occupies the retry queue while it is retrying or awaiting a retry. */
export function isRetryable(status: JobStatus): boolean {
  return status === 'FAILED' || status === 'RETRYING';
}
