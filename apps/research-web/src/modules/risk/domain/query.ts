/**
 * Risk assessment query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic.
 */
import type { RiskAssessmentDto, RiskAssessmentStatusDto, SubjectKindDto } from './dto';

export type RiskSortField = 'title' | 'updatedAt' | 'status' | 'riskLevel';
export type SortDir = 'asc' | 'desc';

export interface RiskQuery {
  readonly search?: string;
  readonly status?: RiskAssessmentStatusDto | 'ALL';
  readonly subjectKind?: SubjectKindDto | 'ALL';
  readonly sortBy?: RiskSortField;
  readonly sortDir?: SortDir;
}

const RISK_LEVEL_RANK: Record<string, number> = {
  NOT_ASSESSED: 0,
  LOW: 1,
  MODERATE: 2,
  ELEVATED: 3,
  HIGH: 4,
};

export function applyRiskQuery(
  data: readonly RiskAssessmentDto[],
  query: RiskQuery,
): RiskAssessmentDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const subjectKind = query.subjectKind ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((assessment) => {
    if (status !== 'ALL' && assessment.status !== status) return false;
    if (subjectKind !== 'ALL' && assessment.subjectKind !== subjectKind) return false;
    if (search) {
      const haystack =
        `${assessment.title} ${assessment.subjectName} ${assessment.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'title') comparison = a.title.localeCompare(b.title);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'riskLevel')
      comparison = (RISK_LEVEL_RANK[a.riskLevel] ?? 0) - (RISK_LEVEL_RANK[b.riskLevel] ?? 0);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
