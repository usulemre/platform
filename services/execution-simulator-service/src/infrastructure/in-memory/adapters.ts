/**
 * In-memory / stub adapters for the execution-simulator service integration and
 * foundation ports. Development/test only — NO storage, NO cache, NO database, NO
 * broker, NO exchange, NO FIX, NO WebSocket, NO execution algorithm, NO fill/price
 * calculation, NO external calls. They satisfy the port contracts so the application
 * layer can run against synthetic data; swapping in real adapters (Market Data
 * Platform, Simulation Runner, Validation Foundation, Workflow Engine, Event & Messaging
 * Foundation, Audit Center, Notification Center, Configuration Foundation) requires no
 * application/domain change.
 */
import type {
  AuditPort,
  ConfigurationPort,
  EventBusPort,
  ExecutionEvent,
  MarketDataPort,
  NotificationPort,
  SimulatorPort,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { SESSIONS } from './seed';

/** Market Data Platform — the requested window is assumed available in the mock. */
export class StubMarketData implements MarketDataPort {
  async isWindowAvailable(): Promise<boolean> {
    return true;
  }
}

/** Simulation Runner — records intent only; NEVER simulates, NEVER contacts an exchange/broker. */
export class StubSimulator implements SimulatorPort {
  async enqueue(): Promise<void> {
    /* no-op: the external simulator executes the paper-trading simulation. */
  }
  async cancel(): Promise<void> {
    /* no-op */
  }
  async pause(): Promise<void> {
    /* no-op */
  }
  async resume(): Promise<void> {
    /* no-op */
  }
  async replay(): Promise<void> {
    /* no-op */
  }
}

/** Validation Foundation — a session is validated when it recorded PASSED. */
export class StubValidation implements ValidationPort {
  async isValidated(sessionId: string): Promise<boolean> {
    return SESSIONS.find((session) => session.id === sessionId)?.validation.status === 'PASSED';
  }
}

/** Workflow Engine — records scheduling intent only. */
export class StubWorkflow implements WorkflowPort {
  async scheduleRun(): Promise<void> {
    /* no-op */
  }
  async scheduleReview(): Promise<void> {
    /* no-op */
  }
  async scheduleApproval(): Promise<void> {
    /* no-op */
  }
  async scheduleReplay(): Promise<void> {
    /* no-op */
  }
}

/** Event & Messaging Foundation — collects published events in memory. */
export class InMemoryEventBus implements EventBusPort {
  readonly published: ExecutionEvent[] = [];
  async publish(event: ExecutionEvent): Promise<void> {
    this.published.push(event);
  }
}

/** Audit Center — collects appended audit entries in memory. */
export class InMemoryAudit implements AuditPort {
  readonly entries: { sessionId: string; actor: string; action: string; at: string }[] = [];
  async record(entry: {
    sessionId: string;
    actor: string;
    action: string;
    at: string;
  }): Promise<void> {
    this.entries.push(entry);
  }
}

/** Notification Center — collects notifications in memory. */
export class InMemoryNotifications implements NotificationPort {
  readonly sent: { sessionId: string; channel: string; summary: string }[] = [];
  async notify(message: { sessionId: string; channel: string; summary: string }): Promise<void> {
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
