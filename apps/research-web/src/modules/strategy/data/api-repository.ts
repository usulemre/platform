/**
 * Real adapter over the governed API gateway. NOT wired in v1. Transport ONLY,
 * through the `@platform/api-client` boundary — never infrastructure, never a
 * decision, never optimization or execution.
 */
import type { ApiClient } from '@platform/api-client';
import type { StrategyDto } from '../domain/dto';
import type { StrategyQuery } from '../domain/query';
import type { StrategyRepository } from './repository';

function buildQueryString(query: StrategyQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.assetClass && query.assetClass !== 'ALL') params.set('assetClass', query.assetClass);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiStrategyRepository implements StrategyRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: StrategyQuery): Promise<readonly StrategyDto[]> {
    return this.api.request<readonly StrategyDto[]>(`/strategies${buildQueryString(query)}`);
  }

  async getById(id: string): Promise<StrategyDto | null> {
    try {
      return await this.api.request<StrategyDto>(`/strategies/${id}`);
    } catch {
      return null;
    }
  }
}
