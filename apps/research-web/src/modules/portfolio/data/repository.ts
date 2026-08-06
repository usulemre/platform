/**
 * Portfolio repository abstraction — the ONLY data boundary the application
 * service depends on. Concrete adapters implement it; the UI never sees a
 * concrete data source and never touches infrastructure.
 */
import type { PortfolioDto } from '../domain/dto';
import type { PortfolioQuery } from '../domain/query';

export type { PortfolioQuery };

export interface PortfolioRepository {
  list(query: PortfolioQuery): Promise<readonly PortfolioDto[]>;
  getById(id: string): Promise<PortfolioDto | null>;
}
