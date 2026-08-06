/**
 * Portfolio query model + pure query application (search / filter / sort). Data-layer
 * logic, not UI logic. Deterministic — mirrors the service's pure discovery/search so
 * both tiers behave identically.
 */
import type { Portfolio, PortfolioStage } from '@platform/portfolio-sdk';

export type PortfolioSortField = 'name' | 'family' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export interface PortfolioQuery {
  readonly search?: string;
  readonly namespace?: string | 'ALL';
  readonly stage?: PortfolioStage | 'ALL';
  readonly tag?: string;
  readonly sortBy?: PortfolioSortField;
  readonly sortDir?: SortDir;
}

export function applyPortfolioQuery(
  data: readonly Portfolio[],
  query: PortfolioQuery,
): Portfolio[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir ?? 'asc';

  const filtered = data.filter((portfolio) => {
    if (namespace !== 'ALL' && portfolio.namespace !== namespace) return false;
    if (stage !== 'ALL' && portfolio.stage !== stage) return false;
    if (tag && !portfolio.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (search) {
      const haystack =
        `${portfolio.name} ${portfolio.namespace} ${portfolio.family} ${portfolio.owner.owner} ${portfolio.tags.join(' ')}`.toLowerCase();
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
