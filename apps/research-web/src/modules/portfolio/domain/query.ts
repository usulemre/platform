/**
 * Portfolio query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic.
 */
import type { PortfolioDto, PortfolioStatusDto } from './dto';

export type PortfolioSortField = 'name' | 'updatedAt' | 'status' | 'mandate';
export type SortDir = 'asc' | 'desc';

export interface PortfolioQuery {
  readonly search?: string;
  readonly status?: PortfolioStatusDto | 'ALL';
  readonly assetClass?: string | 'ALL';
  readonly sortBy?: PortfolioSortField;
  readonly sortDir?: SortDir;
}

export function applyPortfolioQuery(
  data: readonly PortfolioDto[],
  query: PortfolioQuery,
): PortfolioDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const status = query.status ?? 'ALL';
  const assetClass = query.assetClass ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((portfolio) => {
    if (status !== 'ALL' && portfolio.status !== status) return false;
    if (assetClass !== 'ALL' && portfolio.assetClass !== assetClass) return false;
    if (search) {
      const haystack =
        `${portfolio.name} ${portfolio.description} ${portfolio.mandate} ${portfolio.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'mandate') comparison = a.mandate.localeCompare(b.mandate);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
