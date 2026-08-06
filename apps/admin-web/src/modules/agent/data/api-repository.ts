/**
 * Real adapter over the governed API gateway (Agent Registry). NOT wired in v1.
 * Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never an LLM provider, never model inference or prompt execution.
 */
import type { ApiClient } from '@platform/api-client';
import type { AgentDto } from '../domain/dto';
import type { AgentQuery } from '../domain/query';
import type { AgentRepository } from './repository';

function buildQueryString(query: AgentQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.authority && query.authority !== 'ALL') params.set('authority', query.authority);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiAgentRepository implements AgentRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: AgentQuery): Promise<readonly AgentDto[]> {
    return this.api.request<readonly AgentDto[]>(`/agents${buildQueryString(query)}`);
  }

  async getById(id: string): Promise<AgentDto | null> {
    try {
      return await this.api.request<AgentDto>(`/agents/${id}`);
    } catch {
      return null;
    }
  }
}
