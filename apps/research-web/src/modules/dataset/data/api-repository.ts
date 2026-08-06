/**
 * Real adapter over the governed API gateway. NOT wired in v1 (the mock adapter
 * is used until the backend `/datasets` endpoints exist), but it demonstrates the
 * real path: transport ONLY, through the `@platform/api-client` boundary. It
 * never touches infrastructure and makes no decisions.
 */
import type { ApiClient } from '@platform/api-client';
import type { DatasetDto } from '../domain/dto';
import type { DatasetQuery } from '../domain/query';
import type { DatasetRepository } from './repository';

function buildQueryString(query: DatasetQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.assetClass && query.assetClass !== 'ALL') params.set('assetClass', query.assetClass);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiDatasetRepository implements DatasetRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: DatasetQuery): Promise<readonly DatasetDto[]> {
    return this.api.request<readonly DatasetDto[]>(`/datasets${buildQueryString(query)}`);
  }

  async getById(id: string): Promise<DatasetDto | null> {
    try {
      return await this.api.request<DatasetDto>(`/datasets/${id}`);
    } catch {
      return null;
    }
  }
}
