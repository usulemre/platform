/**
 * In-memory read-model adapters. Development/test only — no persistence, no cache, no
 * database. They implement the query ports over the synthetic seed.
 */
import type { RiskAssessment, RiskComparison, RiskFamily, RiskPolicy } from '@platform/risk-sdk';
import type {
  AssessmentQueryPort,
  ComparisonQueryPort,
  FamilyQueryPort,
  PolicyQueryPort,
} from '../ports';
import { ASSESSMENTS, COMPARISONS, FAMILIES, POLICIES } from './seed';

export class InMemoryAssessmentQuery implements AssessmentQueryPort {
  constructor(private readonly data: readonly RiskAssessment[] = ASSESSMENTS) {}
  async list(): Promise<readonly RiskAssessment[]> {
    return this.data;
  }
  async getById(id: string): Promise<RiskAssessment | null> {
    return this.data.find((assessment) => assessment.id === id) ?? null;
  }
}

export class InMemoryFamilyQuery implements FamilyQueryPort {
  constructor(private readonly data: readonly RiskFamily[] = FAMILIES) {}
  async list(): Promise<readonly RiskFamily[]> {
    return this.data;
  }
}

export class InMemoryComparisonQuery implements ComparisonQueryPort {
  constructor(private readonly data: readonly RiskComparison[] = COMPARISONS) {}
  async list(): Promise<readonly RiskComparison[]> {
    return this.data;
  }
  async getById(id: string): Promise<RiskComparison | null> {
    return this.data.find((comparison) => comparison.id === id) ?? null;
  }
}

export class InMemoryPolicyQuery implements PolicyQueryPort {
  constructor(private readonly data: readonly RiskPolicy[] = POLICIES) {}
  async list(): Promise<readonly RiskPolicy[]> {
    return this.data;
  }
}
