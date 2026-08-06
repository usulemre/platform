/**
 * In-memory adapters for the tca-service ports (development/test only). NO database, NO network, NO
 * exchange/broker/FIX. The execution store is a mutable map seeded with synthetic post-trade records;
 * the market-data/validation/workflow/audit/notification/bus adapters record intent or return stub
 * reference data only. The TCA analysis applied to this data is REAL (from `@platform/tca-sdk`).
 */
import type { BenchmarkPrices, ExecutionInput } from '@platform/tca-sdk';
import type {
  AuditPort,
  ConfigurationPort,
  EventBusPort,
  ExecutionStorePort,
  MarketDataPort,
  NotificationPort,
  TcaBusEvent,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { EXECUTIONS } from './seed';

export class InMemoryExecutionStore implements ExecutionStorePort {
  private readonly executions = new Map<string, ExecutionInput>();
  constructor(seed: readonly ExecutionInput[] = EXECUTIONS) {
    for (const execution of seed) this.executions.set(execution.id, execution);
  }
  async list(): Promise<readonly ExecutionInput[]> {
    return [...this.executions.values()];
  }
  async getById(id: string): Promise<ExecutionInput | null> {
    return this.executions.get(id) ?? null;
  }
  async save(execution: ExecutionInput): Promise<void> {
    this.executions.set(execution.id, execution);
  }
}

/** Market Data reference stub — returns no enrichment; seeded executions already carry benchmarks. */
export class StubMarketData implements MarketDataPort {
  async benchmarksFor(): Promise<BenchmarkPrices | null> {
    return null;
  }
}

export class StubValidation implements ValidationPort {
  async isValid(): Promise<boolean> {
    return true;
  }
}

export class StubWorkflow implements WorkflowPort {
  async scheduleAnalysis(): Promise<void> {
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
  readonly events: TcaBusEvent[] = [];
  async publish(event: TcaBusEvent): Promise<void> {
    this.events.push(event);
  }
}

export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
