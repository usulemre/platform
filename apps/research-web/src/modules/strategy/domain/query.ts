/**
 * Strategy query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic.
 */
import type { StrategyDto, StrategyStatusDto } from './dto';

export type StrategySortField = 'name' | 'updatedAt' | 'status' | 'category';
export type SortDir = 'asc' | 'desc';

export interface StrategyQuery {
  readonly search?: string;
  readonly status?: StrategyStatusDto | 'ALL';
  readonly assetClass?: string | 'ALL';
  readonly sortBy?: StrategySortField;
  readonly sortDir?: SortDir;
}

export function applyStrategyQuery(
  data: readonly StrategyDto[],
  query: StrategyQuery,
): StrategyDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const assetClass = query.assetClass ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((strategy) => {
    if (status !== 'ALL' && strategy.status !== status) return false;
    if (assetClass !== 'ALL' && strategy.assetClass !== assetClass) return false;
    if (search) {
      const haystack =
        `${strategy.name} ${strategy.description} ${strategy.category} ${strategy.tags.join(' ')}`.toLowerCase();
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
