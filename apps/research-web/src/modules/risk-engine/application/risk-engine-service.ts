/**
 * Risk Engine application service — the ONLY layer the UI/hooks call. Orchestrates the
 * repository and maps canonical DTOs to view models. No infrastructure, no risk model,
 * no VaR/CVaR, no exposure calculation, no persistence. Aggregation and comparison
 * assembly are pure lookups/reshapes.
 */
import {
  toApprovalQueueItemVm,
  toComparisonListItemVm,
  toComparisonVm,
  toDetailVm,
  toExposureVm,
  toFamilyVm,
  toListItemVm,
  toPolicyVm,
  toReportVm,
  toReviewQueueItemVm,
  toSummaryVm,
  toValidationQueueItemVm,
} from '../domain/mappers';
import type { RiskQuery } from '../domain/query';
import type {
  ComparisonListItemVm,
  ComparisonVm,
  ExposureSummaryRowVm,
  PolicyListItemVm,
  QueueItemVm,
  ReportRowVm,
  RiskDetailVm,
  RiskEngineSummaryVm,
  RiskFamilyVm,
  RiskListItemVm,
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

  async getExceptionQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.exceptionQueue()).map(toReviewQueueItemVm);
  }

  /** Exposure Summary — reported exposures grouped by assessment (values supplied). */
  async getExposureSummary(): Promise<ExposureSummaryRowVm[]> {
    const assessments = await this.repository.listAssessments({});
    return assessments
      .filter((assessment) => assessment.exposures.length > 0)
      .map((assessment) => ({
        assessmentId: assessment.id,
        assessmentName: assessment.name,
        namespace: assessment.namespace,
        exposures: assessment.exposures.map(toExposureVm),
      }));
  }

  /** Risk Reports — every generated report reference across assessments. */
  async getReports(): Promise<ReportRowVm[]> {
    const assessments = await this.repository.listAssessments({});
    return assessments.flatMap((assessment) =>
      assessment.reports.map((report) => ({
        ...toReportVm(report),
        assessmentId: assessment.id,
        assessmentName: assessment.name,
      })),
    );
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
