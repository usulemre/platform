/**
 * Risk application service — the ONLY layer the UI/hooks call. Orchestrates the
 * repository, maps canonical DTOs to view models, and computes the dashboard
 * summary (pure aggregation — NOT statistics). No infrastructure, no UI, no VaR,
 * no optimization. Risk decisions and any execution authorization run through
 * governed workflows / Execution Governance (WCON-2) — never here.
 */
import type { RiskDetailVm, RiskListItemVm, RiskSummaryVm } from '../domain/view-model';
import { toDetailVm, toListItemVm, toSummaryVm } from '../domain/mappers';
import type { RiskQuery } from '../domain/query';
import type { RiskRepository } from '../data/repository';

export class RiskService {
  constructor(private readonly repository: RiskRepository) {}

  async listAssessments(query: RiskQuery = {}): Promise<RiskListItemVm[]> {
    const assessments = await this.repository.list(query);
    return assessments.map(toListItemVm);
  }

  async getAssessment(id: string): Promise<RiskDetailVm | null> {
    const assessment = await this.repository.getById(id);
    return assessment ? toDetailVm(assessment) : null;
  }

  async getSummary(): Promise<RiskSummaryVm> {
    const assessments = await this.repository.list({});
    return toSummaryVm(assessments);
  }
}
