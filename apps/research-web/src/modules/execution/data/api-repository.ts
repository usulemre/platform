/**
 * Real adapter over the governed API gateway. NOT wired in v1. Transport ONLY,
 * through the `@platform/api-client` boundary — never infrastructure, never a
 * broker/exchange, never order routing. It orchestrates via the governed API.
 */
import type { ApiClient } from '@platform/api-client';
import type { ExecutionRequestDto } from '../domain/dto';
import type { ExecutionQuery } from '../domain/query';
import type { ExecutionRepository } from './repository';

function buildQueryString(query: ExecutionQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.mode && query.mode !== 'ALL') params.set('mode', query.mode);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiExecutionRepository implements ExecutionRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: ExecutionQuery): Promise<readonly ExecutionRequestDto[]> {
    return this.api.request<readonly ExecutionRequestDto[]>(
      `/executions${buildQueryString(query)}`,
    );
  }

  async getById(id: string): Promise<ExecutionRequestDto | null> {
    try {
      return await this.api.request<ExecutionRequestDto>(`/executions/${id}`);
    } catch {
      return null;
    }
  }
}
