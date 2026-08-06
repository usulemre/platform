/**
 * In-memory adapters for the execution-engine service ports (development/test only). NO database, NO
 * network, NO broker/exchange/FIX. The stores are mutable maps seeded with realistic executions and
 * sessions; the venue/oms/risk/workflow/audit/notification/bus adapters record intent only. The
 * lifecycle logic applied to these executions is REAL (from the domain).
 */
import type { Execution, ExecutionSession } from '@platform/execution-engine-sdk';
import type {
  AuditPort,
  ConfigurationPort,
  EventBusPort,
  ExecutionBusEvent,
  ExecutionStorePort,
  ExecutionVenuePort,
  NotificationPort,
  OmsPort,
  RiskPort,
  SessionStorePort,
  WorkflowPort,
} from '../ports';
import { EXECUTIONS, SESSIONS } from './seed';

export class InMemoryExecutionStore implements ExecutionStorePort {
  private readonly executions = new Map<string, Execution>();
  constructor(seed: readonly Execution[] = EXECUTIONS) {
    for (const execution of seed) this.executions.set(execution.id, execution);
  }
  async list(): Promise<readonly Execution[]> {
    return [...this.executions.values()];
  }
  async getById(id: string): Promise<Execution | null> {
    return this.executions.get(id) ?? null;
  }
  async save(execution: Execution): Promise<void> {
    this.executions.set(execution.id, execution);
  }
}

export class InMemorySessionStore implements SessionStorePort {
  private readonly sessions = new Map<string, ExecutionSession>();
  constructor(seed: readonly ExecutionSession[] = SESSIONS) {
    for (const session of seed) this.sessions.set(session.id, session);
  }
  async list(): Promise<readonly ExecutionSession[]> {
    return [...this.sessions.values()];
  }
  async getById(id: string): Promise<ExecutionSession | null> {
    return this.sessions.get(id) ?? null;
  }
  async save(session: ExecutionSession): Promise<void> {
    this.sessions.set(session.id, session);
  }
}

/** Execution Venue — records routing/cancel intent only (never contacts a venue). */
export class StubExecutionVenue implements ExecutionVenuePort {
  readonly routed: string[] = [];
  readonly cancelled: string[] = [];
  async route(executionId: string): Promise<void> {
    this.routed.push(executionId);
  }
  async cancel(executionId: string): Promise<void> {
    this.cancelled.push(executionId);
  }
}

export class StubOms implements OmsPort {
  async acknowledge(): Promise<void> {
    /* no-op */
  }
}

export class StubRisk implements RiskPort {
  async isApproved(): Promise<boolean> {
    return true;
  }
}

export class StubWorkflow implements WorkflowPort {
  async scheduleExecution(): Promise<void> {
    /* no-op */
  }
}

export class InMemoryAudit implements AuditPort {
  readonly entries: { executionId: string; actor: string; action: string; at: string }[] = [];
  async record(entry: {
    executionId: string;
    actor: string;
    action: string;
    at: string;
  }): Promise<void> {
    this.entries.push(entry);
  }
}

export class InMemoryNotifications implements NotificationPort {
  readonly messages: { executionId: string; channel: string; summary: string }[] = [];
  async notify(message: { executionId: string; channel: string; summary: string }): Promise<void> {
    this.messages.push(message);
  }
}

export class InMemoryEventBus implements EventBusPort {
  readonly events: ExecutionBusEvent[] = [];
  async publish(event: ExecutionBusEvent): Promise<void> {
    this.events.push(event);
  }
}

export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
