/**
 * Orders application service — the ONLY layer the UI/hooks call. Orchestrates the repository and maps
 * canonical orders to view models, including cross-order aggregate views (timeline, audit, metrics,
 * health). No infrastructure, no broker/exchange SDK, no order execution, no persistence. The
 * lifecycle logic lives in `@platform/order-sdk` / the OMS service; this layer only reshapes.
 */
import {
  computeHealth,
  computeMetrics,
  replay,
  toAuditVm,
  toDetailVm,
  toEventVm,
  toHealthVm,
  toMetricsVm,
  toReplayVm,
  toRowVm,
  toSummaryVm,
  statusVm,
} from '../domain/mappers';
import type { OrderQuery } from '../domain/query';
import type {
  AuditRowVm,
  HealthVm,
  MetricsVm,
  OrderDetailVm,
  OrderRowVm,
  OrdersSummaryVm,
  ReplayVm,
  StatusVm,
  TimelineRowVm,
} from '../domain/view-model';
import type { OrdersRepository } from '../data/repository';

export interface OrderRefVm {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly status: StatusVm;
}

export class OrdersAdminService {
  constructor(private readonly repository: OrdersRepository) {}

  async listOrders(query: OrderQuery = {}): Promise<OrderRowVm[]> {
    return (await this.repository.listOrders(query)).map(toRowVm);
  }

  async getOrder(id: string): Promise<OrderDetailVm | null> {
    const order = await this.repository.getOrder(id);
    return order ? toDetailVm(order) : null;
  }

  async getSummary(): Promise<OrdersSummaryVm> {
    return toSummaryVm(await this.repository.listAll());
  }

  async getMetrics(): Promise<MetricsVm> {
    return toMetricsVm(computeMetrics(await this.repository.listAll()));
  }

  async getHealth(): Promise<HealthVm> {
    return toHealthVm(computeHealth(await this.repository.listAll()));
  }

  /** Order Timeline — every lifecycle event across all orders, newest first. */
  async getTimeline(): Promise<TimelineRowVm[]> {
    const orders = await this.repository.listAll();
    return orders
      .flatMap((order) => order.events.map((event) => ({ event, order })))
      .sort((a, b) => b.event.at.localeCompare(a.event.at))
      .map(({ event, order }) => ({
        ...toEventVm(event),
        orderId: order.id,
        clientOrderId: order.clientOrderId,
        symbol: order.symbol,
      }));
  }

  /** Order Audit — every audit entry across all orders, newest first. */
  async getAudit(): Promise<AuditRowVm[]> {
    const orders = await this.repository.listAll();
    return orders
      .flatMap((order) => order.audit.map((entry) => ({ entry, order })))
      .sort((a, b) => b.entry.at.localeCompare(a.entry.at))
      .map(({ entry, order }) => ({
        ...toAuditVm(entry),
        orderId: order.id,
        clientOrderId: order.clientOrderId,
      }));
  }

  /** Order Replay — event-sourced reconstruction of one order's status timeline. */
  async getReplay(id: string): Promise<ReplayVm | null> {
    const order = await this.repository.getOrder(id);
    return order ? toReplayVm(order, replay(order)) : null;
  }

  /** Order references for the replay/timeline pickers. */
  async listRefs(): Promise<OrderRefVm[]> {
    return (await this.repository.listAll()).map((order) => ({
      id: order.id,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      status: statusVm(order.status),
    }));
  }
}
