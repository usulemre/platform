/**
 * Feature Store repository boundary — the ONLY data abstraction the application
 * service depends on. Concrete adapters implement it; the UI never sees a concrete
 * data source and never touches the service tier, a broker, or persistence.
 */
import type { FeatureFamily, RegisteredFeature } from '@platform/feature-store-sdk';
import type { FeatureQuery } from '../domain/query';

export type { FeatureQuery };

export interface FeatureStoreRepository {
  listFeatures(query: FeatureQuery): Promise<readonly RegisteredFeature[]>;
  getFeature(id: string): Promise<RegisteredFeature | null>;
  listFamilies(): Promise<readonly FeatureFamily[]>;
}
