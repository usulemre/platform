/**
 * Execution request query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic.
 */
import type { ExecutionModeDto, ExecutionRequestDto, ExecutionStatusDto } from './dto';

export type ExecutionSortField = 'title' | 'updatedAt' | 'status';
export type SortDir = 'asc' | 'desc';

export interface ExecutionQuery {
  readonly search?: string;
  readonly status?: ExecutionStatusDto | 'ALL';
  readonly mode?: ExecutionModeDto | 'ALL';
  readonly sortBy?: ExecutionSortField;
  readonly sortDir?: SortDir;
}

export function applyExecutionQuery(
  data: readonly ExecutionRequestDto[],
  query: ExecutionQuery,
): ExecutionRequestDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const mode = query.mode ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((request) => {
    if (status !== 'ALL' && request.status !== status) return false;
    if (mode !== 'ALL' && request.mode !== mode) return false;
    if (search) {
      const haystack =
        `${request.title} ${request.portfolioRef.name} ${request.tags.join(' ')}`.toLowerCase();
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
