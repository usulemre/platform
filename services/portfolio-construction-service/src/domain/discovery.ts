/**
 * Pure Portfolio Construction Engine discovery/search. Deterministic, no IO. Backs
 * the registry and registry-explorer capabilities — no ranking model, no
 * optimization, no weight/risk computation.
 */
import { portfolioKey, type Portfolio, type PortfolioStage } from '@platform/portfolio-sdk';

export interface PortfolioSearch {
  readonly search?: string;
  readonly namespace?: string;
  readonly family?: string;
  readonly stage?: PortfolioStage | 'ALL';
  readonly tag?: string;
}

export function searchPortfolios(
  portfolios: readonly Portfolio[],
  query: PortfolioSearch,
): Portfolio[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const family = query.family ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';

  return portfolios
    .filter((portfolio) => {
      if (namespace !== 'ALL' && portfolio.namespace !== namespace) return false;
      if (family !== 'ALL' && portfolio.family !== family) return false;
      if (stage !== 'ALL' && portfolio.stage !== stage) return false;
      if (tag && !portfolio.tags.some((t) => t.toLowerCase() === tag)) return false;
      if (search) {
        const haystack =
          `${portfolio.name} ${portfolio.namespace} ${portfolio.family} ${portfolio.owner.owner} ${portfolio.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve a portfolio by its canonical `namespace/family/name` key. */
export function resolveByKey(portfolios: readonly Portfolio[], key: string): Portfolio | null {
  const needle = key.trim().toLowerCase();
  return (
    portfolios.find(
      (portfolio) => portfolioKey(portfolio.namespace, portfolio.family, portfolio.name) === needle,
    ) ?? null
  );
}
