/**
 * Experiment repository abstraction — the ONLY data boundary the application
 * service depends on. Concrete adapters implement it; the UI never sees a
 * concrete data source and never touches infrastructure.
 */
import type { ExperimentDto } from '../domain/dto';
import type { ExperimentQuery } from '../domain/query';

export type { ExperimentQuery };

export interface ExperimentRepository {
  list(query: ExperimentQuery): Promise<readonly ExperimentDto[]>;
  getById(id: string): Promise<ExperimentDto | null>;
}
