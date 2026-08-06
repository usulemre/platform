/**
 * In-memory mock adapter for the Orders UI. Synthetic order DATA only — NO broker/exchange SDK, NO
 * API keys, NO HTTP/WebSocket/FIX, NO order execution, no persistence. The orders are built by
 * walking legal lifecycle paths so their event logs replay consistently. This is the UI's own mock,
 * independent of the service tier.
 */
import type { Order } from '@platform/order-sdk';
import { applyOrderQuery, type OrderQuery } from '../domain/query';
import type { OrdersRepository } from './repository';
import { ORDERS } from './seed';

export interface MockRepositoryOptions {
  readonly latencyMs?: number;
}

export class MockOrdersRepository implements OrdersRepository {
  private readonly latencyMs: number;
  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listOrders(query: OrderQuery): Promise<readonly Order[]> {
    await this.delay();
    return applyOrderQuery(ORDERS, query);
  }

  async listAll(): Promise<readonly Order[]> {
    await this.delay();
    return ORDERS;
  }

  async getOrder(id: string): Promise<Order | null> {
    await this.delay();
    return ORDERS.find((order) => order.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }
}

export { ORDERS };
