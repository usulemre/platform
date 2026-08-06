/**
 * Infrastructure INTERFACES (ports) for the risk-engine service. The application and
 * domain layers depend only on these abstractions; concrete adapters are injected at
 * composition time. NO implementation here: no storage, no cache, no database, no
 * broker, no risk model, no VaR/CVaR/stress engine, no exposure calculation. Other
 * subsystems (Portfolio Construction Engine, Backtesting Engine, Signal Engine, Feature
 * Store, Research Engine, Validation Foundation, Workflow Engine, Configuration
 * Foundation, Event & Messaging Foundation, Monitoring Module, Audit Center,
 * Notification Center) are reached through these abstractions by reference only.
 */
import type { RiskAssessment, RiskComparison, RiskFamily, RiskPolicy } from '@platform/risk-sdk';

/* ----------------------------- read models ----------------------------- */

export interface AssessmentQueryPort {
  list(): Promise<readonly RiskAssessment[]>;
  getById(id: string): Promise<RiskAssessment | null>;
}

export interface FamilyQueryPort {
  list(): Promise<readonly RiskFamily[]>;
}

export interface ComparisonQueryPort {
  list(): Promise<readonly RiskComparison[]>;
  getById(id: string): Promise<RiskComparison | null>;
}

export interface PolicyQueryPort {
  list(): Promise<readonly RiskPolicy[]>;
}

/* --------------------------- integration ports -------------------------- */

/** Portfolio Construction Engine — whether the subject portfolio is published (ref only). */
export interface PortfolioPort {
  isPublished(portfolioRef: string): Promise<boolean>;
}

/**
 * Risk Model boundary — the (external, elsewhere-implemented) quantitative risk
 * engine that produces exposures and indicators. This service NEVER computes risk; it
 * only requests an assessment and reflects the reported values through this port.
 */
export interface RiskModelPort {
  requestAssessment(assessmentId: string): Promise<void>;
}

/* --------------------------- foundation ports --------------------------- */

/** Validation Foundation — whether an assessment cleared its validation gate. */
export interface ValidationPort {
  isValidated(assessmentId: string): Promise<boolean>;
}

/** Workflow Engine — schedule policy/exposure/limit/exception/approval/revalidation workflows. */
export interface WorkflowPort {
  scheduleAssessment(assessmentId: string): Promise<void>;
  schedulePolicyValidation(assessmentId: string): Promise<void>;
  scheduleLimitValidation(assessmentId: string): Promise<void>;
  scheduleReview(assessmentId: string): Promise<void>;
  scheduleApproval(assessmentId: string): Promise<void>;
  scheduleRevalidation(assessmentId: string): Promise<void>;
}

export interface RiskEvent {
  readonly id: string;
  readonly assessmentId: string;
  readonly type:
    | 'ASSESSMENT_REQUESTED'
    | 'POLICY_VALIDATION_REQUESTED'
    | 'LIMIT_VALIDATION_REQUESTED'
    | 'REVIEW_REQUESTED'
    | 'APPROVAL_REQUESTED'
    | 'REVALIDATION_REQUESTED'
    | 'EXCEPTION_RAISED'
    | 'OVERRIDE_RECORDED';
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: RiskEvent): Promise<void>;
}

/** Audit Center — append a tamper-evident audit entry (append only; store is elsewhere). */
export interface AuditPort {
  record(entry: {
    readonly assessmentId: string;
    readonly actor: string;
    readonly action: string;
    readonly at: string;
  }): Promise<void>;
}

/** Notification Center — notify a role/channel (delivery is elsewhere). */
export interface NotificationPort {
  notify(message: {
    readonly assessmentId: string;
    readonly channel: string;
    readonly summary: string;
  }): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
