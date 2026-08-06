/**
 * Strategy repository abstraction — the ONLY data boundary the application
 * service depends on. Concrete adapters implement it; the UI never sees a
 * concrete data source and never touches infrastructure.
 */
import type { StrategyDto } from '../domain/dto';
import type { StrategyQuery } from '../domain/query';

export type { StrategyQuery };

export interface StrategyRepository {
  list(query: StrategyQuery): Promise<readonly StrategyDto[]>;
  getById(id: string): Promise<StrategyDto | null>;
}
