/**
 * In-memory adapters for the smart-order-router service ports (development/test only). NO database,
 * NO network, NO exchange/broker/FIX. The stores are mutable maps; the venue store holds a blacklist
 * set; the execution/risk/workflow/audit/notification/bus adapters record intent only. The routing
 * logic applied to this data is REAL (from the domain).
 */
import { VENUES, type Routing, type Venue, type VenueStatus } from '@platform/sor-sdk';
import type {
  AuditPort,
  ConfigurationPort,
  EventBusPort,
  ExecutionEnginePort,
  NotificationPort,
  RiskPort,
  RoutingBusEvent,
  RoutingStorePort,
  VenueStorePort,
  WorkflowPort,
} from '../ports';
import { ROUTINGS } from './seed';

export class InMemoryRoutingStore implements RoutingStorePort {
  private readonly routings = new Map<string, Routing>();
  constructor(seed: readonly Routing[] = ROUTINGS) {
    for (const routing of seed) this.routings.set(routing.id, routing);
  }
  async list(): Promise<readonly Routing[]> {
    return [...this.routings.values()];
  }
  async getById(id: string): Promise<Routing | null> {
    return this.routings.get(id) ?? null;
  }
  async save(routing: Routing): Promise<void> {
    this.routings.set(routing.id, routing);
  }
}

/** Venue registry — the canonical venue catalog with a mutable blacklist. */
export class InMemoryVenueStore implements VenueStorePort {
  private readonly blacklistSet = new Set<string>();
  constructor(private readonly base: readonly Venue[] = VENUES) {}
  async list(): Promise<readonly Venue[]> {
    return this.base.map((venue) =>
      this.blacklistSet.has(venue.id) ? { ...venue, status: 'BLACKLISTED' as VenueStatus } : venue,
    );
  }
  async getById(id: string): Promise<Venue | null> {
    return (await this.list()).find((venue) => venue.id === id) ?? null;
  }
  async blacklist(venueId: string): Promise<void> {
    this.blacklistSet.add(venueId);
  }
  async recover(venueId: string): Promise<void> {
    this.blacklistSet.delete(venueId);
  }
  async blacklisted(): Promise<readonly string[]> {
    return [...this.blacklistSet];
  }
}

export class StubExecutionEngine implements ExecutionEnginePort {
  readonly handoffs: { executionId: string; venueId: string }[] = [];
  async handOff(executionId: string, venueId: string): Promise<void> {
    this.handoffs.push({ executionId, venueId });
  }
}

export class StubRisk implements RiskPort {
  async isApproved(): Promise<boolean> {
    return true;
  }
}

export class StubWorkflow implements WorkflowPort {
  async scheduleRouting(): Promise<void> {
    /* no-op */
  }
}

export class InMemoryAudit implements AuditPort {
  readonly entries: { routingId: string; actor: string; action: string; at: string }[] = [];
  async record(entry: {
    routingId: string;
    actor: string;
    action: string;
    at: string;
  }): Promise<void> {
    this.entries.push(entry);
  }
}

export class InMemoryNotifications implements NotificationPort {
  readonly messages: { routingId: string; channel: string; summary: string }[] = [];
  async notify(message: { routingId: string; channel: string; summary: string }): Promise<void> {
    this.messages.push(message);
  }
}

export class InMemoryEventBus implements EventBusPort {
  readonly events: RoutingBusEvent[] = [];
  async publish(event: RoutingBusEvent): Promise<void> {
    this.events.push(event);
  }
}

export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
