/**
 * Real adapter over the governed API gateway. NOT wired in v1. Transport ONLY,
 * through the `@platform/api-client` boundary — never infrastructure, never a
 * decision, never VaR computation or execution authorization.
 */
import type { ApiClient } from '@platform/api-client';
import type { RiskAssessmentDto } from '../domain/dto';
import type { RiskQuery } from '../domain/query';
import type { RiskRepository } from './repository';

function buildQueryString(query: RiskQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.subjectKind && query.subjectKind !== 'ALL')
    params.set('subjectKind', query.subjectKind);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiRiskRepository implements RiskRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: RiskQuery): Promise<readonly RiskAssessmentDto[]> {
    return this.api.request<readonly RiskAssessmentDto[]>(
      `/risk-assessments${buildQueryString(query)}`,
    );
  }

  async getById(id: string): Promise<RiskAssessmentDto | null> {
    try {
      return await this.api.request<RiskAssessmentDto>(`/risk-assessments/${id}`);
    } catch {
      return null;
    }
  }
}
