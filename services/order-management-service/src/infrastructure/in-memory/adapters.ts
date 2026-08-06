/**
 * In-memory adapters for the order-management service ports (development/test only). NO database, NO
 * network, NO broker/exchange/FIX. The order store is a mutable map seeded with realistic orders;
 * the gateway/risk/workflow/audit/notification/bus adapters record intent only. The lifecycle logic
 * applied to these orders is REAL (from the domain).
 */
import type { Order } from '@platform/order-sdk';
import type {
  AuditPort,
  ConfigurationPort,
  EventBusPort,
  ExecutionGatewayPort,
  NotificationPort,
  OrderBusEvent,
  OrderStorePort,
  RiskPort,
  WorkflowPort,
} from '../ports';
import { ORDERS } from './seed';

/** The OMS order store — the single source of truth for orders (in-memory v1). */
export class InMemoryOrderStore implements OrderStorePort {
  private readonly orders = new Map<string, Order>();
  constructor(seed: readonly Order[] = ORDERS) {
    for (const order of seed) this.orders.set(order.id, order);
  }
  async list(): Promise<readonly Order[]> {
    return [...this.orders.values()];
  }
  async getById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }
  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }
}

/** Execution Gateway — records routing/submission/cancel intent only (never contacts a venue). */
export class StubExecutionGateway implements ExecutionGatewayPort {
  readonly routed: string[] = [];
  readonly submitted: string[] = [];
  readonly cancelled: string[] = [];
  async route(orderId: string): Promise<void> {
    this.routed.push(orderId);
  }
  async submit(orderId: string): Promise<void> {
    this.submitted.push(orderId);
  }
  async cancel(orderId: string): Promise<void> {
    this.cancelled.push(orderId);
  }
}

export class StubRisk implements RiskPort {
  async isApproved(): Promise<boolean> {
    return true;
  }
}

export class StubWorkflow implements WorkflowPort {
  async scheduleApproval(): Promise<void> {
    /* no-op */
  }
}

export class InMemoryAudit implements AuditPort {
  readonly entries: { orderId: string; actor: string; action: string; at: string }[] = [];
  async record(entry: {
    orderId: string;
    actor: string;
    action: string;
    at: string;
  }): Promise<void> {
    this.entries.push(entry);
  }
}

export class InMemoryNotifications implements NotificationPort {
  readonly messages: { orderId: string; channel: string; summary: string }[] = [];
  async notify(message: { orderId: string; channel: string; summary: string }): Promise<void> {
    this.messages.push(message);
  }
}

export class InMemoryEventBus implements EventBusPort {
  readonly events: OrderBusEvent[] = [];
  async publish(event: OrderBusEvent): Promise<void> {
    this.events.push(event);
  }
}

export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
