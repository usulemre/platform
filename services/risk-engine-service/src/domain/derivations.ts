/**
 * Pure Risk Engine domain derivations. Deterministic, no IO, no VaR/CVaR, no exposure
 * calculation. These back the queue, versioning and comparison-assembly capabilities.
 * Metric VALUES are passed through unchanged — never calculated.
 */
import {
  compareVersions,
  type MetricKey,
  type RiskAssessment,
  type RiskComparison,
  type RiskVersion,
} from '@platform/risk-sdk';

/** The current recommended version — newest by semantic order. */
export function currentVersion(assessment: RiskAssessment): RiskVersion | null {
  return assessment.versions.reduce<RiskVersion | null>((best, candidate) => {
    if (!best) return candidate;
    return compareVersions(candidate.version, best.version) > 0 ? candidate : best;
  }, null);
}

/** Assessments in an active review stage — the review queue. */
export function reviewQueue(assessments: readonly RiskAssessment[]): RiskAssessment[] {
  return assessments.filter(
    (assessment) =>
      assessment.stage === 'EXPOSURE_REVIEW' ||
      assessment.stage === 'EXCEPTION_REVIEW' ||
      assessment.reviews.some((r) => r.status === 'PENDING'),
  );
}

/** Assessments in a validation stage — the validation queue. */
export function validationQueue(assessments: readonly RiskAssessment[]): RiskAssessment[] {
  return assessments.filter(
    (assessment) =>
      assessment.stage === 'POLICY_VALIDATION' || assessment.stage === 'LIMIT_VALIDATION',
  );
}

/** Assessments awaiting a governance approval decision. */
export function approvalQueue(assessments: readonly RiskAssessment[]): RiskAssessment[] {
  return assessments.filter((assessment) =>
    assessment.approvals.some((approval) => approval.status === 'PENDING'),
  );
}

/** Assessments with at least one open exception — the exception queue. */
export function exceptionQueue(assessments: readonly RiskAssessment[]): RiskAssessment[] {
  return assessments.filter((assessment) =>
    assessment.exceptions.some((exception) => exception.status === 'OPEN'),
  );
}

export interface ComparisonRow {
  readonly assessmentId: string;
  readonly assessmentName: string;
  readonly values: Readonly<Record<string, string>>;
}

export interface AssembledComparison {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly metricKeys: readonly MetricKey[];
  readonly rows: readonly ComparisonRow[];
}

/**
 * Assemble a comparison table by pulling each assessment's supplied metric values.
 * PURE lookup + reshape — NO metric is computed, ranked or scored here.
 */
export function assembleComparison(
  comparison: RiskComparison,
  assessments: readonly RiskAssessment[],
): AssembledComparison {
  const byId = new Map(assessments.map((assessment) => [assessment.id, assessment]));
  const rows: ComparisonRow[] = comparison.assessmentIds.map((assessmentId) => {
    const assessment = byId.get(assessmentId);
    const metricValues = new Map(
      (assessment?.metrics ?? []).map((metric) => [metric.key, metric.value]),
    );
    const values: Record<string, string> = {};
    for (const key of comparison.metricKeys) values[key] = metricValues.get(key) ?? '—';
    return { assessmentId, assessmentName: assessment?.name ?? assessmentId, values };
  });
  return {
    id: comparison.id,
    name: comparison.name,
    note: comparison.note,
    metricKeys: comparison.metricKeys,
    rows,
  };
}
