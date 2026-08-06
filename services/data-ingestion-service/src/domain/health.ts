/**
 * Pure pipeline-health derivation. Deterministic, no IO. Maps operational status
 * and quality into a single health signal for dashboards.
 */
import type { PipelineHealth, PipelineStatus, QualityGrade } from '@platform/data-sdk';

export function deriveHealth(status: PipelineStatus, quality: QualityGrade): PipelineHealth {
  if (status === 'FAILED') return 'DOWN';
  if (status === 'RETIRED' || status === 'DRAFT') return 'UNKNOWN';
  if (status === 'PAUSED') return 'UNKNOWN';
  if (status === 'DEGRADED' || quality === 'FAIL') return 'DOWN';
  if (quality === 'WARN') return 'DEGRADED';
  return 'HEALTHY';
}
