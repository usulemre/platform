/**
 * Real adapter over the governed API gateway (Connector Registry service). NOT
 * wired in v1. Transport ONLY, through the `@platform/api-client` boundary —
 * never infrastructure, never a provider SDK, never a direct HTTP client to an
 * external API. It talks to the platform's own gateway, which owns any real
 * connector implementation.
 */
import type { ApiClient } from '@platform/api-client';
import type { ConnectorDto } from '../domain/dto';
import type { ConnectorQuery } from '../domain/query';
import type { ConnectorRepository } from './repository';

function buildQueryString(query: ConnectorQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.type && query.type !== 'ALL') params.set('type', query.type);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiConnectorRepository implements ConnectorRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: ConnectorQuery): Promise<readonly ConnectorDto[]> {
    return this.api.request<readonly ConnectorDto[]>(`/connectors${buildQueryString(query)}`);
  }

  async getById(id: string): Promise<ConnectorDto | null> {
    try {
      return await this.api.request<ConnectorDto>(`/connectors/${id}`);
    } catch {
      return null;
    }
  }
}
