/**
 * In-memory / stub adapters for the performance-analytics service integration and foundation
 * ports. Development/test only — NO storage, NO cache, NO database, NO broker, NO formulas, NO
 * metric calculation, NO statistical algorithms, NO external calls. They satisfy the port
 * contracts so the application layer can run against synthetic data; swapping in real adapters
 * (Analytics Runtime, Validation Foundation, Workflow Engine, Event & Messaging Foundation,
 * Configuration Foundation) requires no application/domain change.
 */
import type {
  AnalyticsEvent,
  AnalyticsRuntimePort,
  ConfigurationPort,
  EventBusPort,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { REPORTS } from './seed';

/** Analytics Runtime — records intent only; NEVER computes a metric or evaluates a formula. */
export class StubAnalyticsRuntime implements AnalyticsRuntimePort {
  async requestComputation(): Promise<void> {
    /* no-op: the external analytics runtime computes metric values. */
  }
}

/** Validation Foundation — a report is validated when it recorded PASSED. */
export class StubValidation implements ValidationPort {
  async isValidated(reportId: string): Promise<boolean> {
    return REPORTS.find((report) => report.id === reportId)?.validation.status === 'PASSED';
  }
}

/** Workflow Engine — records scheduling intent only. */
export class StubWorkflow implements WorkflowPort {
  async scheduleComputation(): Promise<void> {
    /* no-op */
  }
  async scheduleReview(): Promise<void> {
    /* no-op */
  }
  async scheduleApproval(): Promise<void> {
    /* no-op */
  }
}

/** Event & Messaging Foundation — collects published events in memory. */
export class InMemoryEventBus implements EventBusPort {
  readonly published: AnalyticsEvent[] = [];
  async publish(event: AnalyticsEvent): Promise<void> {
    this.published.push(event);
  }
}

/** Configuration Foundation — static, non-secret configuration by key. */
export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
