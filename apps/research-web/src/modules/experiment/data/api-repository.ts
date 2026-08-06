/**
 * Real adapter over the governed API gateway. NOT wired in v1. Transport ONLY,
 * through the `@platform/api-client` boundary — never infrastructure, never a
 * decision. Live workflow state would additionally come via `@platform/workflow-sdk`.
 */
import type { ApiClient } from '@platform/api-client';
import type { ExperimentDto } from '../domain/dto';
import type { ExperimentQuery } from '../domain/query';
import type { ExperimentRepository } from './repository';

function buildQueryString(query: ExperimentQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.outcome && query.outcome !== 'ALL') params.set('outcome', query.outcome);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiExperimentRepository implements ExperimentRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: ExperimentQuery): Promise<readonly ExperimentDto[]> {
    return this.api.request<readonly ExperimentDto[]>(`/experiments${buildQueryString(query)}`);
  }

  async getById(id: string): Promise<ExperimentDto | null> {
    try {
      return await this.api.request<ExperimentDto>(`/experiments/${id}`);
    } catch {
      return null;
    }
  }
}
