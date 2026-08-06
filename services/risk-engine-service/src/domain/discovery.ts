/**
 * Pure Risk Engine discovery/search. Deterministic, no IO. Backs the registry and
 * registry-explorer capabilities — no ranking model, no VaR/CVaR, no exposure
 * calculation.
 */
import { assessmentKey, type RiskAssessment, type RiskStage } from '@platform/risk-sdk';

export interface AssessmentSearch {
  readonly search?: string;
  readonly namespace?: string;
  readonly family?: string;
  readonly stage?: RiskStage | 'ALL';
  readonly tag?: string;
}

export function searchAssessments(
  assessments: readonly RiskAssessment[],
  query: AssessmentSearch,
): RiskAssessment[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const family = query.family ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';

  return assessments
    .filter((assessment) => {
      if (namespace !== 'ALL' && assessment.namespace !== namespace) return false;
      if (family !== 'ALL' && assessment.family !== family) return false;
      if (stage !== 'ALL' && assessment.stage !== stage) return false;
      if (tag && !assessment.tags.some((t) => t.toLowerCase() === tag)) return false;
      if (search) {
        const haystack =
          `${assessment.name} ${assessment.namespace} ${assessment.family} ${assessment.subjectName} ${assessment.owner.owner} ${assessment.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve an assessment by its canonical `namespace/family/name` key. */
export function resolveByKey(
  assessments: readonly RiskAssessment[],
  key: string,
): RiskAssessment | null {
  const needle = key.trim().toLowerCase();
  return (
    assessments.find(
      (assessment) =>
        assessmentKey(assessment.namespace, assessment.family, assessment.name) === needle,
    ) ?? null
  );
}
