/**
 * Experiment query model + pure query application (search / filter / sort).
 * Data-layer logic (how a source narrows results), not UI logic. Deterministic.
 */
import type { ExperimentDto, ExperimentOutcomeDto, ExperimentStatusDto } from './dto';

export type ExperimentSortField = 'title' | 'updatedAt' | 'status';
export type SortDir = 'asc' | 'desc';

export interface ExperimentQuery {
  readonly search?: string;
  readonly status?: ExperimentStatusDto | 'ALL';
  readonly outcome?: ExperimentOutcomeDto | 'ALL';
  readonly sortBy?: ExperimentSortField;
  readonly sortDir?: SortDir;
}

export function applyExperimentQuery(
  data: readonly ExperimentDto[],
  query: ExperimentQuery,
): ExperimentDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const outcome = query.outcome ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((experiment) => {
    if (status !== 'ALL' && experiment.status !== status) return false;
    if (outcome !== 'ALL' && experiment.outcome !== outcome) return false;
    if (search) {
      const haystack =
        `${experiment.title} ${experiment.researchQuestion} ${experiment.owner} ${experiment.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'title') comparison = a.title.localeCompare(b.title);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
