/**
 * Orders repository boundary — the ONLY data abstraction the application service depends on. Concrete
 * adapters implement it; the UI never sees a concrete data source and never touches the service tier,
 * a broker, an exchange, a credential, or persistence.
 */
import type { Order } from '@platform/order-sdk';
import type { OrderQuery } from '../domain/query';

export type { OrderQuery };

export interface OrdersRepository {
  listOrders(query: OrderQuery): Promise<readonly Order[]>;
  listAll(): Promise<readonly Order[]>;
  getOrder(id: string): Promise<Order | null>;
}
