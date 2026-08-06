/**
 * Real adapter over the governed API gateway (feature-store service). NOT wired
 * in v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never a broker, never persistence.
 */
import type { ApiClient } from '@platform/api-client';
import type { FeatureFamily, RegisteredFeature } from '@platform/feature-store-sdk';
import type { FeatureQuery } from '../domain/query';
import type { FeatureStoreRepository } from './repository';

function buildQueryString(query: FeatureQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.namespace && query.namespace !== 'ALL') params.set('namespace', query.namespace);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.tag) params.set('tag', query.tag);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiFeatureStoreRepository implements FeatureStoreRepository {
  constructor(private readonly api: ApiClient) {}

  listFeatures(query: FeatureQuery): Promise<readonly RegisteredFeature[]> {
    return this.api.request<readonly RegisteredFeature[]>(
      `/feature-store/features${buildQueryString(query)}`,
    );
  }

  async getFeature(id: string): Promise<RegisteredFeature | null> {
    try {
      return await this.api.request<RegisteredFeature>(`/feature-store/features/${id}`);
    } catch {
      return null;
    }
  }

  listFamilies(): Promise<readonly FeatureFamily[]> {
    return this.api.request<readonly FeatureFamily[]>('/feature-store/families');
  }
}
