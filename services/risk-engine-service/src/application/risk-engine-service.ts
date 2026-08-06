/**
 * Risk-engine application service — the orchestration surface of the canonical Risk
 * Engine. It coordinates the risk-governance lifecycle (draft → assessment requested →
 * policy validation → exposure review → limit validation → exception review → approval
 * → execution authorized → archived), governance controls (revalidate / raise
 * exception / record override), discovery/search, registry reads, the review /
 * validation / approval / exception queues, policy and rule access, exposure summaries
 * and comparison across the other subsystems (Portfolio Construction Engine, external
 * Risk Model, Validation Foundation, Workflow Engine, Configuration Foundation, Event &
 * Messaging Foundation, Audit Center, Notification Center) through ports ONLY.
 *
 * It holds no infrastructure, no risk model, no VaR/CVaR/stress engine, no exposure
 * calculation and no persistence. Search, aggregation, queue selection, comparison
 * assembly and version selection are pure domain decisions. Policy/limit validation
 * verdicts and approvals are decided elsewhere (CP-5), and exposures are produced
 * elsewhere; this service only reflects and reroutes them.
 */
import {
  METRIC_CATALOG,
  type MetricDescriptor,
  type RiskAssessment,
  type RiskComparison,
  type RiskFamily,
  type RiskPolicy,
  type RiskStage,
  type RiskVersion,
} from '@platform/risk-sdk';
import {
  approvalQueue,
  assembleComparison,
  currentVersion,
  exceptionQueue,
  reviewQueue,
  validationQueue,
  type AssembledComparison,
} from '../domain/derivations';
import { resolveByKey, searchAssessments, type AssessmentSearch } from '../domain/discovery';
import {
  canRaiseException,
  canRecordOverride,
  isRevalidatable,
  proposedNextStage,
} from '../domain/lifecycle';
import type {
  AssessmentQueryPort,
  AuditPort,
  ComparisonQueryPort,
  ConfigurationPort,
  EventBusPort,
  FamilyQueryPort,
  NotificationPort,
  PolicyQueryPort,
  PortfolioPort,
  RiskModelPort,
  ValidationPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface RiskEngineSummary {
  readonly totalAssessments: number;
  readonly inValidation: number;
  readonly inReview: number;
  readonly awaitingApproval: number;
  readonly openExceptions: number;
  readonly activeOverrides: number;
  readonly executionAuthorized: number;
  readonly blocked: number;
  readonly families: number;
  readonly policies: number;
  readonly byStage: readonly { readonly stage: RiskStage; readonly count: number }[];
}

export type GovernanceControl = 'revalidate' | 'raise-exception' | 'record-override';

export interface RiskEngineServiceDeps {
  readonly assessments: AssessmentQueryPort;
  readonly families: FamilyQueryPort;
  readonly comparisons: ComparisonQueryPort;
  readonly policies: PolicyQueryPort;
  readonly portfolio: PortfolioPort;
  readonly riskModel: RiskModelPort;
  readonly validation: ValidationPort;
  readonly workflow: WorkflowPort;
  readonly bus: EventBusPort;
  readonly audit: AuditPort;
  readonly notifications: NotificationPort;
  readonly config: ConfigurationPort;
}

export class RiskEngineService {
  constructor(private readonly deps: RiskEngineServiceDeps) {}

  /** Risk Registry — every registered risk assessment. */
  listAssessments(): Promise<readonly RiskAssessment[]> {
    return this.deps.assessments.list();
  }

  /** Registry Explorer / Search — pure filter over the registry. */
  async searchAssessments(query: AssessmentSearch = {}): Promise<readonly RiskAssessment[]> {
    return searchAssessments(await this.deps.assessments.list(), query);
  }

  /** Portfolio Risk Details — resolve one assessment by id. */
  getAssessment(id: string): Promise<RiskAssessment | null> {
    return this.deps.assessments.getById(id);
  }

  /** Resolve an assessment by its canonical `namespace/family/name` key. */
  async resolveAssessment(key: string): Promise<RiskAssessment | null> {
    return resolveByKey(await this.deps.assessments.list(), key);
  }

  /** The current recommended version (newest by semantic order). */
  async currentVersion(id: string): Promise<RiskVersion | null> {
    const assessment = await this.deps.assessments.getById(id);
    return assessment ? currentVersion(assessment) : null;
  }

  /** The stage an assessment would advance to next (pure ordering; no decision). */
  async proposedNextStage(id: string): Promise<RiskStage | null> {
    const assessment = await this.deps.assessments.getById(id);
    return assessment ? proposedNextStage(assessment) : null;
  }

  /** Risk family browsing. */
  listFamilies(): Promise<readonly RiskFamily[]> {
    return this.deps.families.list();
  }

  /** Risk Policies. */
  listPolicies(): Promise<readonly RiskPolicy[]> {
    return this.deps.policies.list();
  }

  /** The metric catalog — descriptors only; nothing is computed. */
  metricCatalog(): readonly MetricDescriptor[] {
    return METRIC_CATALOG;
  }

  /** Risk Validation Queue — assessments in a validation stage. */
  async validationQueue(): Promise<readonly RiskAssessment[]> {
    return validationQueue(await this.deps.assessments.list());
  }

  /** Risk Review Queue — assessments in a review stage. */
  async reviewQueue(): Promise<readonly RiskAssessment[]> {
    return reviewQueue(await this.deps.assessments.list());
  }

  /** Risk Approval Queue — assessments awaiting a governance approval decision. */
  async approvalQueue(): Promise<readonly RiskAssessment[]> {
    return approvalQueue(await this.deps.assessments.list());
  }

  /** Risk Exceptions — assessments with at least one open exception. */
  async exceptionQueue(): Promise<readonly RiskAssessment[]> {
    return exceptionQueue(await this.deps.assessments.list());
  }

  /** Risk comparisons. */
  listComparisons(): Promise<readonly RiskComparison[]> {
    return this.deps.comparisons.list();
  }

  /** Assemble a comparison table by pulling each assessment's supplied metric values. */
  async getComparison(id: string): Promise<AssembledComparison | null> {
    const comparison = await this.deps.comparisons.getById(id);
    if (!comparison) return null;
    return assembleComparison(comparison, await this.deps.assessments.list());
  }

  /** Whether an assessment cleared its validation gate (decided by Validation). */
  isValidated(id: string): Promise<boolean> {
    return this.deps.validation.isValidated(id);
  }

  async getSummary(): Promise<RiskEngineSummary> {
    const [assessments, families, policies] = await Promise.all([
      this.deps.assessments.list(),
      this.deps.families.list(),
      this.deps.policies.list(),
    ]);
    const stageCount = new Map<RiskStage, number>();
    for (const assessment of assessments)
      stageCount.set(assessment.stage, (stageCount.get(assessment.stage) ?? 0) + 1);
    return {
      totalAssessments: assessments.length,
      inValidation: validationQueue(assessments).length,
      inReview: reviewQueue(assessments).length,
      awaitingApproval: approvalQueue(assessments).length,
      openExceptions: assessments.reduce(
        (sum, a) => sum + a.exceptions.filter((e) => e.status === 'OPEN').length,
        0,
      ),
      activeOverrides: assessments.reduce(
        (sum, a) => sum + a.overrides.filter((o) => o.status === 'ACTIVE').length,
        0,
      ),
      executionAuthorized: assessments.filter(
        (a) => a.stage === 'EXECUTION_AUTHORIZED' || a.stage === 'ARCHIVED',
      ).length,
      blocked: assessments.filter((a) => a.decision === 'BLOCKED').length,
      families: families.length,
      policies: policies.length,
      byStage: [...stageCount.entries()].map(([stage, count]) => ({ stage, count })),
    };
  }

  /**
   * Request a risk assessment. The exposures/indicators are produced by the external
   * Risk Model; this only requests and records the request.
   */
  async requestAssessment(assessmentId: string, at: string): Promise<boolean> {
    const assessment = await this.deps.assessments.getById(assessmentId);
    if (!assessment) return false;
    await this.deps.riskModel.requestAssessment(assessmentId);
    await this.deps.workflow.scheduleAssessment(assessmentId);
    await this.deps.audit.record({
      assessmentId,
      actor: 'risk-engine',
      action: 'ASSESSMENT_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${assessmentId}:ASSESSMENT_REQUESTED:${at}`,
      assessmentId,
      type: 'ASSESSMENT_REQUESTED',
      message: `Assessment requested for ${assessment.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request policy validation (verdict decided by deterministic engines). */
  async requestPolicyValidation(assessmentId: string, at: string): Promise<boolean> {
    const assessment = await this.deps.assessments.getById(assessmentId);
    if (!assessment) return false;
    await this.deps.workflow.schedulePolicyValidation(assessmentId);
    await this.deps.audit.record({
      assessmentId,
      actor: 'risk-engine',
      action: 'POLICY_VALIDATION_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${assessmentId}:POLICY_VALIDATION_REQUESTED:${at}`,
      assessmentId,
      type: 'POLICY_VALIDATION_REQUESTED',
      message: `Policy validation requested for ${assessment.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request limit validation (verdict decided by deterministic engines). */
  async requestLimitValidation(assessmentId: string, at: string): Promise<boolean> {
    const assessment = await this.deps.assessments.getById(assessmentId);
    if (!assessment) return false;
    await this.deps.workflow.scheduleLimitValidation(assessmentId);
    await this.deps.audit.record({
      assessmentId,
      actor: 'risk-engine',
      action: 'LIMIT_VALIDATION_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${assessmentId}:LIMIT_VALIDATION_REQUESTED:${at}`,
      assessmentId,
      type: 'LIMIT_VALIDATION_REQUESTED',
      message: `Limit validation requested for ${assessment.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request an independent risk review (verdict decided by the reviewer). */
  async requestReview(assessmentId: string, at: string): Promise<boolean> {
    const assessment = await this.deps.assessments.getById(assessmentId);
    if (!assessment) return false;
    await this.deps.workflow.scheduleReview(assessmentId);
    await this.deps.audit.record({
      assessmentId,
      actor: 'risk-engine',
      action: 'REVIEW_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${assessmentId}:REVIEW_REQUESTED:${at}`,
      assessmentId,
      type: 'REVIEW_REQUESTED',
      message: `Review requested for ${assessment.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request governance approval (the decision is made by accountable humans). */
  async requestApproval(assessmentId: string, at: string): Promise<boolean> {
    const assessment = await this.deps.assessments.getById(assessmentId);
    if (!assessment) return false;
    await this.deps.workflow.scheduleApproval(assessmentId);
    await this.deps.notifications.notify({
      assessmentId,
      channel: 'risk-governance',
      summary: `Approval requested for ${assessment.name}.`,
    });
    await this.deps.audit.record({
      assessmentId,
      actor: 'risk-engine',
      action: 'APPROVAL_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${assessmentId}:APPROVAL_REQUESTED:${at}`,
      assessmentId,
      type: 'APPROVAL_REQUESTED',
      message: `Approval requested for ${assessment.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Apply a governance control (revalidate / raise-exception / record-override).
   * Returns false when the control is not structurally permitted for the current state
   * or the assessment is unknown. The actual disposition/decision happens elsewhere.
   */
  async applyControl(
    assessmentId: string,
    control: GovernanceControl,
    at: string,
  ): Promise<boolean> {
    const assessment = await this.deps.assessments.getById(assessmentId);
    if (!assessment) return false;

    const allowed =
      (control === 'revalidate' && isRevalidatable(assessment)) ||
      (control === 'raise-exception' && canRaiseException(assessment)) ||
      (control === 'record-override' && canRecordOverride(assessment));
    if (!allowed) return false;

    if (control === 'revalidate') {
      await this.deps.workflow.scheduleRevalidation(assessmentId);
      await this.deps.audit.record({
        assessmentId,
        actor: 'risk-engine',
        action: 'REVALIDATION_REQUESTED',
        at,
      });
      await this.deps.bus.publish({
        id: `${assessmentId}:REVALIDATION_REQUESTED:${at}`,
        assessmentId,
        type: 'REVALIDATION_REQUESTED',
        message: `Revalidation requested for ${assessment.name}.`,
        occurredAt: at,
      });
    } else if (control === 'raise-exception') {
      await this.deps.audit.record({
        assessmentId,
        actor: 'risk-engine',
        action: 'EXCEPTION_RAISED',
        at,
      });
      await this.deps.bus.publish({
        id: `${assessmentId}:EXCEPTION_RAISED:${at}`,
        assessmentId,
        type: 'EXCEPTION_RAISED',
        message: `Exception raised for ${assessment.name}.`,
        occurredAt: at,
      });
    } else {
      await this.deps.audit.record({
        assessmentId,
        actor: 'risk-engine',
        action: 'OVERRIDE_RECORDED',
        at,
      });
      await this.deps.bus.publish({
        id: `${assessmentId}:OVERRIDE_RECORDED:${at}`,
        assessmentId,
        type: 'OVERRIDE_RECORDED',
        message: `Override recorded for ${assessment.name}.`,
        occurredAt: at,
      });
    }
    return true;
  }
}
