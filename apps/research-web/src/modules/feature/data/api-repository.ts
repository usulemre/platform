/**
 * Real adapter over the governed API gateway. NOT wired in v1. Transport ONLY,
 * through the `@platform/api-client` boundary — never infrastructure, never a
 * decision.
 */
import type { ApiClient } from '@platform/api-client';
import type { FeatureDto } from '../domain/dto';
import type { FeatureQuery } from '../domain/query';
import type { FeatureRepository } from './repository';

function buildQueryString(query: FeatureQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.category && query.category !== 'ALL') params.set('category', query.category);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiFeatureRepository implements FeatureRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: FeatureQuery): Promise<readonly FeatureDto[]> {
    return this.api.request<readonly FeatureDto[]>(`/features${buildQueryString(query)}`);
  }

  async getById(id: string): Promise<FeatureDto | null> {
    try {
      return await this.api.request<FeatureDto>(`/features/${id}`);
    } catch {
      return null;
    }
  }
}
