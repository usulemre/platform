/**
 * Risk assessment repository abstraction — the ONLY data boundary the application
 * service depends on. Concrete adapters implement it; the UI never sees a concrete
 * data source and never touches infrastructure.
 */
import type { RiskAssessmentDto } from '../domain/dto';
import type { RiskQuery } from '../domain/query';

export type { RiskQuery };

export interface RiskRepository {
  list(query: RiskQuery): Promise<readonly RiskAssessmentDto[]>;
  getById(id: string): Promise<RiskAssessmentDto | null>;
}
