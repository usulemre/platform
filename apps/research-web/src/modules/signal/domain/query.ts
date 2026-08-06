/**
 * Signal query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic.
 */
import type { SignalDto, SignalStatusDto } from './dto';

export type SignalSortField = 'name' | 'updatedAt' | 'status' | 'category';
export type SortDir = 'asc' | 'desc';

export interface SignalQuery {
  readonly search?: string;
  readonly status?: SignalStatusDto | 'ALL';
  readonly assetClass?: string | 'ALL';
  readonly sortBy?: SignalSortField;
  readonly sortDir?: SortDir;
}

export function applySignalQuery(data: readonly SignalDto[], query: SignalQuery): SignalDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const assetClass = query.assetClass ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((signal) => {
    if (status !== 'ALL' && signal.status !== status) return false;
    if (assetClass !== 'ALL' && signal.assetClass !== assetClass) return false;
    if (search) {
      const haystack =
        `${signal.name} ${signal.description} ${signal.category} ${signal.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'category') comparison = a.category.localeCompare(b.category);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
