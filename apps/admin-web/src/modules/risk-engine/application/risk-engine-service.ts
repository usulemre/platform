/**
 * Risk Engine application service (admin-web) — the ONLY layer the UI/hooks call.
 * Orchestrates the repository and maps canonical DTOs to view models. Adds
 * administrator aggregation views (rule explorer, limit configuration, exceptions,
 * overrides, audit timeline) across the registry. No infrastructure, no risk model, no
 * VaR/CVaR, no exposure calculation, no persistence. Aggregation and comparison
 * assembly are pure lookups/reshapes.
 */
import {
  toApprovalQueueItemVm,
  toAuditVm,
  toComparisonListItemVm,
  toComparisonVm,
  toDetailVm,
  toExceptionVm,
  toFamilyVm,
  toLimitVm,
  toListItemVm,
  toOverrideVm,
  toPolicyVm,
  toReviewQueueItemVm,
  toRuleVm,
  toSummaryVm,
  toValidationQueueItemVm,
} from '../domain/mappers';
import type { RiskQuery } from '../domain/query';
import type {
  AuditTimelineRowVm,
  ComparisonListItemVm,
  ComparisonVm,
  ExceptionRowVm,
  LimitRowVm,
  OverrideRowVm,
  PolicyListItemVm,
  QueueItemVm,
  RiskDetailVm,
  RiskEngineSummaryVm,
  RiskFamilyVm,
  RiskListItemVm,
  RuleRowVm,
} from '../domain/view-model';
import type { RiskEngineRepository } from '../data/repository';

export class RiskEngineAdminService {
  constructor(private readonly repository: RiskEngineRepository) {}

  async listAssessments(query: RiskQuery = {}): Promise<RiskListItemVm[]> {
    return (await this.repository.listAssessments(query)).map(toListItemVm);
  }

  async getAssessment(id: string): Promise<RiskDetailVm | null> {
    const assessment = await this.repository.getAssessment(id);
    return assessment ? toDetailVm(assessment) : null;
  }

  async listFamilies(): Promise<RiskFamilyVm[]> {
    return (await this.repository.listFamilies()).map(toFamilyVm);
  }

  async listPolicies(): Promise<PolicyListItemVm[]> {
    return (await this.repository.listPolicies()).map((policy) => ({
      ...toPolicyVm(policy),
      ref: policy.ref,
    }));
  }

  async getValidationQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.validationQueue()).map(toValidationQueueItemVm);
  }

  async getReviewQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.reviewQueue()).map(toReviewQueueItemVm);
  }

  async getApprovalQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.approvalQueue()).map(toApprovalQueueItemVm);
  }

  /** Risk Rule Explorer — every evaluated rule across the registry. */
  async getRuleExplorer(): Promise<RuleRowVm[]> {
    const assessments = await this.repository.listAssessments({});
    return assessments.flatMap((assessment) =>
      assessment.rules.map((rule) => ({
        ...toRuleVm(rule),
        assessmentId: assessment.id,
        assessmentName: assessment.name,
        policyRef: rule.policyRef,
      })),
    );
  }

  /** Limit Configuration — every configured limit across the registry. */
  async getLimitConfiguration(): Promise<LimitRowVm[]> {
    const assessments = await this.repository.listAssessments({});
    return assessments.flatMap((assessment) =>
      assessment.limits.map((limit) => ({
        ...toLimitVm(limit),
        assessmentId: assessment.id,
        assessmentName: assessment.name,
      })),
    );
  }

  /** Risk Exceptions — every exception across the registry. */
  async getExceptions(): Promise<ExceptionRowVm[]> {
    const assessments = await this.repository.listAssessments({});
    return assessments.flatMap((assessment) =>
      assessment.exceptions.map((exception) => ({
        ...toExceptionVm(exception),
        assessmentId: assessment.id,
        assessmentName: assessment.name,
      })),
    );
  }

  /** Risk Overrides — every override across the registry. */
  async getOverrides(): Promise<OverrideRowVm[]> {
    const assessments = await this.repository.listAssessments({});
    return assessments.flatMap((assessment) =>
      assessment.overrides.map((override) => ({
        ...toOverrideVm(override),
        assessmentId: assessment.id,
        assessmentName: assessment.name,
      })),
    );
  }

  /** Risk Audit Timeline — every audit entry across the registry, newest first. */
  async getAuditTimeline(): Promise<AuditTimelineRowVm[]> {
    const assessments = await this.repository.listAssessments({});
    return assessments
      .flatMap((assessment) => assessment.audit.map((entry) => ({ entry, assessment })))
      .sort((a, b) => b.entry.occurredAt.localeCompare(a.entry.occurredAt))
      .map(({ entry, assessment }) => ({
        ...toAuditVm(entry),
        assessmentId: assessment.id,
        assessmentName: assessment.name,
      }));
  }

  async listComparisons(): Promise<ComparisonListItemVm[]> {
    return (await this.repository.listComparisons()).map(toComparisonListItemVm);
  }

  async getComparison(id: string): Promise<ComparisonVm | null> {
    const comparison = await this.repository.getComparison(id);
    if (!comparison) return null;
    const assessments = await this.repository.listAssessments({});
    return toComparisonVm(comparison, assessments);
  }

  async getSummary(): Promise<RiskEngineSummaryVm> {
    const [assessments, families, policies] = await Promise.all([
      this.repository.listAssessments({}),
      this.repository.listFamilies(),
      this.repository.listPolicies(),
    ]);
    return toSummaryVm(assessments, families.length, policies.length);
  }
}
