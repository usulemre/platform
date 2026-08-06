/**
 * Real adapter over the governed API gateway. NOT wired in v1. Transport ONLY,
 * through the `@platform/api-client` boundary — never infrastructure, never a
 * decision, never optimization, sizing or execution.
 */
import type { ApiClient } from '@platform/api-client';
import type { PortfolioDto } from '../domain/dto';
import type { PortfolioQuery } from '../domain/query';
import type { PortfolioRepository } from './repository';

function buildQueryString(query: PortfolioQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.assetClass && query.assetClass !== 'ALL') params.set('assetClass', query.assetClass);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiPortfolioRepository implements PortfolioRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: PortfolioQuery): Promise<readonly PortfolioDto[]> {
    return this.api.request<readonly PortfolioDto[]>(`/portfolios${buildQueryString(query)}`);
  }

  async getById(id: string): Promise<PortfolioDto | null> {
    try {
      return await this.api.request<PortfolioDto>(`/portfolios/${id}`);
    } catch {
      return null;
    }
  }
}
