/**
 * Feature repository abstraction — the ONLY data boundary the application service
 * depends on. Concrete adapters implement it; the UI never sees a concrete data
 * source and never touches infrastructure.
 */
import type { FeatureDto } from '../domain/dto';
import type { FeatureQuery } from '../domain/query';

export type { FeatureQuery };

export interface FeatureRepository {
  list(query: FeatureQuery): Promise<readonly FeatureDto[]>;
  getById(id: string): Promise<FeatureDto | null>;
}
