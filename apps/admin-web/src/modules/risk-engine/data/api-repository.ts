/**
 * Real adapter over the governed API gateway (risk-engine service). NOT wired in v1.
 * Transport ONLY, through the `@platform/api-client` boundary — never infrastructure,
 * never a broker, never a risk model, never persistence.
 */
import type { ApiClient } from '@platform/api-client';
import type { RiskAssessment, RiskComparison, RiskFamily, RiskPolicy } from '@platform/risk-sdk';
import type { RiskQuery } from '../domain/query';
import type { RiskEngineRepository } from './repository';

function buildQueryString(query: RiskQuery): string {
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

export class ApiRiskEngineRepository implements RiskEngineRepository {
  constructor(private readonly api: ApiClient) {}

  listAssessments(query: RiskQuery): Promise<readonly RiskAssessment[]> {
    return this.api.request<readonly RiskAssessment[]>(
      `/risk-engine/assessments${buildQueryString(query)}`,
    );
  }

  async getAssessment(id: string): Promise<RiskAssessment | null> {
    try {
      return await this.api.request<RiskAssessment>(`/risk-engine/assessments/${id}`);
    } catch {
      return null;
    }
  }

  listFamilies(): Promise<readonly RiskFamily[]> {
    return this.api.request<readonly RiskFamily[]>('/risk-engine/families');
  }

  listPolicies(): Promise<readonly RiskPolicy[]> {
    return this.api.request<readonly RiskPolicy[]>('/risk-engine/policies');
  }

  validationQueue(): Promise<readonly RiskAssessment[]> {
    return this.api.request<readonly RiskAssessment[]>('/risk-engine/queues/validation');
  }

  reviewQueue(): Promise<readonly RiskAssessment[]> {
    return this.api.request<readonly RiskAssessment[]>('/risk-engine/queues/review');
  }

  approvalQueue(): Promise<readonly RiskAssessment[]> {
    return this.api.request<readonly RiskAssessment[]>('/risk-engine/queues/approval');
  }

  exceptionQueue(): Promise<readonly RiskAssessment[]> {
    return this.api.request<readonly RiskAssessment[]>('/risk-engine/queues/exception');
  }

  listComparisons(): Promise<readonly RiskComparison[]> {
    return this.api.request<readonly RiskComparison[]>('/risk-engine/comparisons');
  }

  async getComparison(id: string): Promise<RiskComparison | null> {
    try {
      return await this.api.request<RiskComparison>(`/risk-engine/comparisons/${id}`);
    } catch {
      return null;
    }
  }
}
