/**
 * Risk assessment query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic — mirrors the service's pure
 * discovery/search so both tiers behave identically.
 */
import type { RiskAssessment, RiskStage } from '@platform/risk-sdk';

export type RiskSortField = 'name' | 'family' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export interface RiskQuery {
  readonly search?: string;
  readonly namespace?: string | 'ALL';
  readonly stage?: RiskStage | 'ALL';
  readonly tag?: string;
  readonly sortBy?: RiskSortField;
  readonly sortDir?: SortDir;
}

export function applyRiskQuery(
  data: readonly RiskAssessment[],
  query: RiskQuery,
): RiskAssessment[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir ?? 'asc';

  const filtered = data.filter((assessment) => {
    if (namespace !== 'ALL' && assessment.namespace !== namespace) return false;
    if (stage !== 'ALL' && assessment.stage !== stage) return false;
    if (tag && !assessment.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (search) {
      const haystack =
        `${assessment.name} ${assessment.namespace} ${assessment.family} ${assessment.subjectName} ${assessment.owner.owner} ${assessment.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'family')
      comparison = `${a.namespace}/${a.family}`.localeCompare(`${b.namespace}/${b.family}`);
    else if (sortBy === 'updatedAt') comparison = a.updatedAt.localeCompare(b.updatedAt);
    else comparison = a.name.localeCompare(b.name);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
