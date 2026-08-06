/**
 * Risk Engine repository boundary — the ONLY data abstraction the application service
 * depends on. Concrete adapters implement it; the UI never sees a concrete data source
 * and never touches the service tier, a broker, a risk model, or persistence.
 */
import type { RiskAssessment, RiskComparison, RiskFamily, RiskPolicy } from '@platform/risk-sdk';
import type { RiskQuery } from '../domain/query';

export type { RiskQuery };

export interface RiskEngineRepository {
  listAssessments(query: RiskQuery): Promise<readonly RiskAssessment[]>;
  getAssessment(id: string): Promise<RiskAssessment | null>;
  listFamilies(): Promise<readonly RiskFamily[]>;
  listPolicies(): Promise<readonly RiskPolicy[]>;
  validationQueue(): Promise<readonly RiskAssessment[]>;
  reviewQueue(): Promise<readonly RiskAssessment[]>;
  approvalQueue(): Promise<readonly RiskAssessment[]>;
  exceptionQueue(): Promise<readonly RiskAssessment[]>;
  listComparisons(): Promise<readonly RiskComparison[]>;
  getComparison(id: string): Promise<RiskComparison | null>;
}
