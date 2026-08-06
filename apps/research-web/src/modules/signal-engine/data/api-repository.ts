/**
 * Real adapter over the governed API gateway (signal-engine service). NOT wired
 * in v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never a broker, never an exchange, never persistence.
 */
import type { ApiClient } from '@platform/api-client';
import type { RegisteredSignal, SignalFamily } from '@platform/signal-sdk';
import type { SignalQuery } from '../domain/query';
import type { SignalEngineRepository } from './repository';

function buildQueryString(query: SignalQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.namespace && query.namespace !== 'ALL') params.set('namespace', query.namespace);
  if (query.stage && query.stage !== 'ALL') params.set('stage', query.stage);
  if (query.tag) params.set('tag', query.tag);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiSignalEngineRepository implements SignalEngineRepository {
  constructor(private readonly api: ApiClient) {}

  listSignals(query: SignalQuery): Promise<readonly RegisteredSignal[]> {
    return this.api.request<readonly RegisteredSignal[]>(
      `/signal-engine/signals${buildQueryString(query)}`,
    );
  }

  async getSignal(id: string): Promise<RegisteredSignal | null> {
    try {
      return await this.api.request<RegisteredSignal>(`/signal-engine/signals/${id}`);
    } catch {
      return null;
    }
  }

  listFamilies(): Promise<readonly SignalFamily[]> {
    return this.api.request<readonly SignalFamily[]>('/signal-engine/families');
  }

  promotionQueue(): Promise<readonly RegisteredSignal[]> {
    return this.api.request<readonly RegisteredSignal[]>('/signal-engine/queues/promotion');
  }

  approvalQueue(): Promise<readonly RegisteredSignal[]> {
    return this.api.request<readonly RegisteredSignal[]>('/signal-engine/queues/approval');
  }
}
