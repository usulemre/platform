/**
 * Dataset repository abstraction — the ONLY data boundary the application service
 * depends on. Concrete adapters (mock / governed API) implement this interface;
 * the UI never sees a concrete data source and never touches infrastructure.
 */
import type { DatasetDto } from '../domain/dto';
import type { DatasetQuery } from '../domain/query';

export type { DatasetQuery };

export interface DatasetRepository {
  list(query: DatasetQuery): Promise<readonly DatasetDto[]>;
  getById(id: string): Promise<DatasetDto | null>;
}
