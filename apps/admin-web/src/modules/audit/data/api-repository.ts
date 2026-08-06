/**
 * Real adapter over the governed API gateway (audit service). NOT wired in v1.
 * Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never event storage, never logging. Read-only.
 */
import type { ApiClient } from '@platform/api-client';
import type { AuditEventDto, Page } from '../domain/dto';
import type { AuditQuery } from '../domain/query';
import type { AuditRepository } from './repository';

function buildQueryString(query: AuditQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.category && query.category !== 'ALL') params.set('category', query.category);
  if (query.outcome && query.outcome !== 'ALL') params.set('outcome', query.outcome);
  if (query.order) params.set('order', query.order);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiAuditRepository implements AuditRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: AuditQuery): Promise<Page<AuditEventDto>> {
    return this.api.request<Page<AuditEventDto>>(`/audit/events${buildQueryString(query)}`);
  }

  async getById(id: string): Promise<AuditEventDto | null> {
    try {
      return await this.api.request<AuditEventDto>(`/audit/events/${id}`);
    } catch {
      return null;
    }
  }

  all(): Promise<readonly AuditEventDto[]> {
    return this.api.request<readonly AuditEventDto[]>('/audit/events?pageSize=1000');
  }
}
