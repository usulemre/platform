/**
 * Dataset query model + pure query application (search / filter / sort).
 *
 * This is data-layer logic (how a data source narrows results), NOT UI logic.
 * A real backend applies the same query server-side; the mock repository reuses
 * this pure function. Deterministic — no ambient state.
 */
import type { DatasetDto, DatasetStatusDto } from './dto';

export type DatasetSortField = 'name' | 'updatedAt' | 'status';
export type SortDir = 'asc' | 'desc';

export interface DatasetQuery {
  readonly search?: string;
  readonly status?: DatasetStatusDto | 'ALL';
  readonly assetClass?: string | 'ALL';
  readonly sortBy?: DatasetSortField;
  readonly sortDir?: SortDir;
}

export function applyDatasetQuery(data: readonly DatasetDto[], query: DatasetQuery): DatasetDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const assetClass = query.assetClass ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((dataset) => {
    if (status !== 'ALL' && dataset.status !== status) return false;
    if (assetClass !== 'ALL' && dataset.assetClass !== assetClass) return false;
    if (search) {
      const haystack =
        `${dataset.name} ${dataset.description} ${dataset.vendor} ${dataset.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
