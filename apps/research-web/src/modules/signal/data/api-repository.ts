/**
 * Real adapter over the governed API gateway. NOT wired in v1. Transport ONLY,
 * through the `@platform/api-client` boundary — never infrastructure, never a
 * decision, never execution.
 */
import type { ApiClient } from '@platform/api-client';
import type { SignalDto } from '../domain/dto';
import type { SignalQuery } from '../domain/query';
import type { SignalRepository } from './repository';

function buildQueryString(query: SignalQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.assetClass && query.assetClass !== 'ALL') params.set('assetClass', query.assetClass);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiSignalRepository implements SignalRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: SignalQuery): Promise<readonly SignalDto[]> {
    return this.api.request<readonly SignalDto[]>(`/signals${buildQueryString(query)}`);
  }

  async getById(id: string): Promise<SignalDto | null> {
    try {
      return await this.api.request<SignalDto>(`/signals/${id}`);
    } catch {
      return null;
    }
  }
}
