/**
 * Real adapter over the governed API gateway (portfolio-construction service). NOT
 * wired in v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never a broker, never an optimizer, never persistence.
 */
import type { ApiClient } from '@platform/api-client';
import type {
  Portfolio,
  PortfolioComparison,
  PortfolioFamily,
  PortfolioTemplate,
} from '@platform/portfolio-sdk';
import type { PortfolioQuery } from '../domain/query';
import type { PortfolioConstructionRepository } from './repository';

function buildQueryString(query: PortfolioQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.namespace && query.namespace !== 'ALL') params.set('namespace', query.namespace);
  if (query.stage && query.stage !== 'ALL') params.set('stage', query.stage);
  if (query.tag) params.set('tag', query.tag);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiPortfolioConstructionRepository implements PortfolioConstructionRepository {
  constructor(private readonly api: ApiClient) {}

  listPortfolios(query: PortfolioQuery): Promise<readonly Portfolio[]> {
    return this.api.request<readonly Portfolio[]>(
      `/portfolio-construction/portfolios${buildQueryString(query)}`,
    );
  }

  async getPortfolio(id: string): Promise<Portfolio | null> {
    try {
      return await this.api.request<Portfolio>(`/portfolio-construction/portfolios/${id}`);
    } catch {
      return null;
    }
  }

  listFamilies(): Promise<readonly PortfolioFamily[]> {
    return this.api.request<readonly PortfolioFamily[]>('/portfolio-construction/families');
  }

  listTemplates(): Promise<readonly PortfolioTemplate[]> {
    return this.api.request<readonly PortfolioTemplate[]>('/portfolio-construction/templates');
  }

  optimizationQueue(): Promise<readonly Portfolio[]> {
    return this.api.request<readonly Portfolio[]>('/portfolio-construction/queues/optimization');
  }

  approvalQueue(): Promise<readonly Portfolio[]> {
    return this.api.request<readonly Portfolio[]>('/portfolio-construction/queues/approval');
  }

  listComparisons(): Promise<readonly PortfolioComparison[]> {
    return this.api.request<readonly PortfolioComparison[]>('/portfolio-construction/comparisons');
  }

  async getComparison(id: string): Promise<PortfolioComparison | null> {
    try {
      return await this.api.request<PortfolioComparison>(
        `/portfolio-construction/comparisons/${id}`,
      );
    } catch {
      return null;
    }
  }
}
