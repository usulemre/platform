/**
 * In-memory adapters for the broker-gateway service ports (development/test only). NO database, NO
 * network, NO exchange/broker/FIX. The broker store is a mutable map; the provider registry resolves
 * injected placeholder adapters by id; the validation/workflow/audit/notification/monitoring/bus
 * adapters record intent only. The lifecycle/health logic applied to this data is REAL (from the
 * domain + `@platform/broker-sdk`).
 */
import type {
  Broker,
  BrokerCapabilityType,
  BrokerProviderFactory,
  BrokerProviderPort,
  ProviderId,
} from '@platform/broker-sdk';
import type {
  AuditPort,
  BrokerStorePort,
  ConfigurationPort,
  EventBusPort,
  GatewayBusEvent,
  MonitoringPort,
  NotificationPort,
  ProviderRegistryPort,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { BROKERS } from './seed';

export class InMemoryBrokerStore implements BrokerStorePort {
  private readonly brokers = new Map<string, Broker>();
  constructor(seed: readonly Broker[] = BROKERS) {
    for (const broker of seed) this.brokers.set(broker.id, broker);
  }
  async list(): Promise<readonly Broker[]> {
    return [...this.brokers.values()];
  }
  async getById(id: string): Promise<Broker | null> {
    return this.brokers.get(id) ?? null;
  }
  async save(broker: Broker): Promise<void> {
    this.brokers.set(broker.id, broker);
  }
}

/** Provider registry — resolves injected provider adapters (placeholders in v1) by id. */
export class InMemoryProviderRegistry implements ProviderRegistryPort {
  private readonly cache = new Map<ProviderId, BrokerProviderPort>();
  constructor(private readonly factories: Readonly<Record<string, BrokerProviderFactory>>) {}
  providerIds(): readonly ProviderId[] {
    return Object.keys(this.factories) as ProviderId[];
  }
  resolve(id: ProviderId): BrokerProviderPort | null {
    const factory = this.factories[id];
    if (!factory) return null;
    const cached = this.cache.get(id);
    if (cached) return cached;
    const provider = factory();
    this.cache.set(id, provider);
    return provider;
  }
  supports(id: ProviderId, capability: BrokerCapabilityType): boolean {
    return this.resolve(id)?.supports(capability) ?? false;
  }
}

export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}

export class StubValidation implements ValidationPort {
  async isValid(): Promise<boolean> {
    return true;
  }
}

export class StubWorkflow implements WorkflowPort {
  readonly scheduled: { brokerId: string; task: string }[] = [];
  async scheduleGatewayTask(brokerId: string, task: string): Promise<void> {
    this.scheduled.push({ brokerId, task });
  }
}

export class InMemoryAudit implements AuditPort {
  readonly entries: { brokerId: string; actor: string; action: string; at: string }[] = [];
  async record(entry: {
    brokerId: string;
    actor: string;
    action: string;
    at: string;
  }): Promise<void> {
    this.entries.push(entry);
  }
}

export class InMemoryNotifications implements NotificationPort {
  readonly messages: { brokerId: string; channel: string; summary: string }[] = [];
  async notify(message: { brokerId: string; channel: string; summary: string }): Promise<void> {
    this.messages.push(message);
  }
}

export class InMemoryMonitoring implements MonitoringPort {
  readonly signals: { brokerId: string; level: string; score: number; at: string }[] = [];
  async publishHealth(signal: {
    brokerId: string;
    level: string;
    score: number;
    at: string;
  }): Promise<void> {
    this.signals.push(signal);
  }
}

export class InMemoryEventBus implements EventBusPort {
  readonly events: GatewayBusEvent[] = [];
  async publish(event: GatewayBusEvent): Promise<void> {
    this.events.push(event);
  }
}
