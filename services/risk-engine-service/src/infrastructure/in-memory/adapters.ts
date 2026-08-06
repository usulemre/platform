/**
 * In-memory / stub adapters for the risk-engine service integration and foundation
 * ports. Development/test only — NO storage, NO cache, NO database, NO broker, NO risk
 * model, NO VaR/CVaR/stress engine, NO exposure calculation, NO external calls. They
 * satisfy the port contracts so the application layer can run against synthetic data;
 * swapping in real adapters (Portfolio Construction Engine, Risk Model, Validation
 * Foundation, Workflow Engine, Event & Messaging Foundation, Audit Center, Notification
 * Center, Configuration Foundation) requires no application/domain change.
 */
import type {
  AuditPort,
  ConfigurationPort,
  EventBusPort,
  NotificationPort,
  PortfolioPort,
  RiskEvent,
  RiskModelPort,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { ASSESSMENTS } from './seed';

/** Portfolio Construction Engine — the subject portfolio is assumed published in the mock. */
export class StubPortfolio implements PortfolioPort {
  async isPublished(): Promise<boolean> {
    return true;
  }
}

/** Risk Model — records intent only; NEVER computes VaR/CVaR/exposures here. */
export class StubRiskModel implements RiskModelPort {
  async requestAssessment(): Promise<void> {
    /* no-op: the external risk model produces exposures and indicators. */
  }
}

/** Validation Foundation — an assessment is validated when it recorded PASSED. */
export class StubValidation implements ValidationPort {
  async isValidated(assessmentId: string): Promise<boolean> {
    return (
      ASSESSMENTS.find((assessment) => assessment.id === assessmentId)?.validation.status ===
      'PASSED'
    );
  }
}

/** Workflow Engine — records scheduling intent only. */
export class StubWorkflow implements WorkflowPort {
  async scheduleAssessment(): Promise<void> {
    /* no-op */
  }
  async schedulePolicyValidation(): Promise<void> {
    /* no-op */
  }
  async scheduleLimitValidation(): Promise<void> {
    /* no-op */
  }
  async scheduleReview(): Promise<void> {
    /* no-op */
  }
  async scheduleApproval(): Promise<void> {
    /* no-op */
  }
  async scheduleRevalidation(): Promise<void> {
    /* no-op */
  }
}

/** Event & Messaging Foundation — collects published events in memory. */
export class InMemoryEventBus implements EventBusPort {
  readonly published: RiskEvent[] = [];
  async publish(event: RiskEvent): Promise<void> {
    this.published.push(event);
  }
}

/** Audit Center — collects appended audit entries in memory. */
export class InMemoryAudit implements AuditPort {
  readonly entries: { assessmentId: string; actor: string; action: string; at: string }[] = [];
  async record(entry: {
    assessmentId: string;
    actor: string;
    action: string;
    at: string;
  }): Promise<void> {
    this.entries.push(entry);
  }
}

/** Notification Center — collects notifications in memory. */
export class InMemoryNotifications implements NotificationPort {
  readonly sent: { assessmentId: string; channel: string; summary: string }[] = [];
  async notify(message: { assessmentId: string; channel: string; summary: string }): Promise<void> {
    this.sent.push(message);
  }
}

/** Configuration Foundation — static, non-secret configuration by key. */
export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
