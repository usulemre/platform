/**
 * In-memory mock adapter for the Risk Engine UI. Synthetic risk-governance METADATA
 * ONLY — NO VaR, NO CVaR, NO stress testing, NO exposure calculation, no persistence.
 * Portfolio/backtest/signal/strategy references use the other modules' ids so
 * cross-links resolve; exposure values, limit bounds and metric VALUES are inert
 * strings. This is the UI's own mock, independent of the service tier.
 */
import type { RiskAssessment, RiskComparison, RiskFamily, RiskPolicy } from '@platform/risk-sdk';
import { applyRiskQuery, type RiskQuery } from '../domain/query';
import type { RiskEngineRepository } from './repository';
import { RISK_ENGINE_SEED } from './seed';

const {
  assessments: ASSESSMENTS,
  families: FAMILIES,
  policies: POLICIES,
  comparisons: COMPARISONS,
} = RISK_ENGINE_SEED;

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockRiskEngineRepository implements RiskEngineRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listAssessments(query: RiskQuery): Promise<readonly RiskAssessment[]> {
    await this.delay();
    return applyRiskQuery(ASSESSMENTS, query);
  }

  async getAssessment(id: string): Promise<RiskAssessment | null> {
    await this.delay();
    return ASSESSMENTS.find((assessment) => assessment.id === id) ?? null;
  }

  async listFamilies(): Promise<readonly RiskFamily[]> {
    await this.delay();
    return FAMILIES;
  }

  async listPolicies(): Promise<readonly RiskPolicy[]> {
    await this.delay();
    return POLICIES;
  }

  async validationQueue(): Promise<readonly RiskAssessment[]> {
    await this.delay();
    return ASSESSMENTS.filter(
      (a) => a.stage === 'POLICY_VALIDATION' || a.stage === 'LIMIT_VALIDATION',
    );
  }

  async reviewQueue(): Promise<readonly RiskAssessment[]> {
    await this.delay();
    return ASSESSMENTS.filter(
      (a) =>
        a.stage === 'EXPOSURE_REVIEW' ||
        a.stage === 'EXCEPTION_REVIEW' ||
        a.reviews.some((r) => r.status === 'PENDING'),
    );
  }

  async approvalQueue(): Promise<readonly RiskAssessment[]> {
    await this.delay();
    return ASSESSMENTS.filter((a) => a.approvals.some((approval) => approval.status === 'PENDING'));
  }

  async exceptionQueue(): Promise<readonly RiskAssessment[]> {
    await this.delay();
    return ASSESSMENTS.filter((a) => a.exceptions.some((exception) => exception.status === 'OPEN'));
  }

  async listComparisons(): Promise<readonly RiskComparison[]> {
    await this.delay();
    return COMPARISONS;
  }

  async getComparison(id: string): Promise<RiskComparison | null> {
    await this.delay();
    return COMPARISONS.find((comparison) => comparison.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export { RISK_ENGINE_SEED };
