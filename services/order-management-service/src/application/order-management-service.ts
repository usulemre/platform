/**
 * Order-management application service — the orchestration surface of the canonical Order Management
 * System (OMS). It is the single source of truth for orders before they are routed to execution
 * venues. It drives the REAL order lifecycle (create → validated → pending approval → approved →
 * queued → submitted → accepted → partially filled → filled / cancelled / rejected / expired) and
 * the lifecycle actions (replace / amend / suspend / resume / cancel / retry), records fills, serves
 * the blotter/active/completed/rejected/cancelled views, the timeline, audit, history, replay,
 * metrics and health, and integrates with the Portfolio Optimization Engine, Risk Engine, Execution
 * Simulator, Live Trading Platform, Signal Calculation Engine, Workflow Engine, Validation
 * Foundation, Configuration Foundation, Monitoring Module, Audit Center and Notification Center
 * through ports ONLY.
 *
 * It holds no broker/exchange SDK, no API keys, no HTTP/WebSocket/FIX, and no order execution. All
 * lifecycle transitions are enforced by the state machine; routing is an abstraction recorded on the
 * order and dispatched through the Execution Gateway port.
 */
import {
  isActiveStatus,
  isTerminalStatus,
  isWorkingStatus,
  type Order,
  type OrderAction,
  type OrderEvent,
  type OrderFill,
  type OrderHistory,
  type OrderRequest,
  type OrderStatus,
} from '@platform/order-sdk';
import {
  type AmendChanges,
  acceptOrder,
  applyAction,
  createOrder,
  decideApproval,
  defaultRoute,
  expireOrder,
  queueOrder,
  recordFill,
  requestApproval,
  submitOrder,
  validateOrder,
  type LifecycleResult,
} from '../domain/lifecycle';
import { validateOrderRequest } from '../domain/validation';
import { applyOrderSearch, inScope, type OrderScope, type OrderSearch } from '../domain/search';
import { computeOrderMetrics, type OrderMetrics } from '../domain/metrics';
import { computeHealth, type OrderHealth } from '../domain/health';
import { replayOrder, type ReplayResult } from '../domain/replay';
import type {
  AuditPort,
  ConfigurationPort,
  EventBusPort,
  ExecutionGatewayPort,
  NotificationPort,
  OrderStorePort,
  RiskPort,
  WorkflowPort,
} from '../infrastructure/ports';

export type OperationResult =
  | { readonly ok: true; readonly order: Order }
  | { readonly ok: false; readonly reason: string };

export interface OrderManagementServiceDeps {
  readonly store: OrderStorePort;
  readonly gateway: ExecutionGatewayPort;
  readonly risk: RiskPort;
  readonly workflow: WorkflowPort;
  readonly audit: AuditPort;
  readonly notifications: NotificationPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class OrderManagementService {
  constructor(private readonly deps: OrderManagementServiceDeps) {}

  /* ------------------------------ read models ------------------------------ */

  listOrders(): Promise<readonly Order[]> {
    return this.deps.store.list();
  }

  async searchOrders(query: OrderSearch = {}): Promise<readonly Order[]> {
    return applyOrderSearch(await this.deps.store.list(), query);
  }

  getOrder(id: string): Promise<Order | null> {
    return this.deps.store.getById(id);
  }

  private async scope(scope: OrderScope): Promise<readonly Order[]> {
    return (await this.deps.store.list()).filter((order) => inScope(order, scope));
  }

  activeOrders(): Promise<readonly Order[]> {
    return this.scope('ACTIVE');
  }
  workingOrders(): Promise<readonly Order[]> {
    return this.scope('WORKING');
  }
  completedOrders(): Promise<readonly Order[]> {
    return this.scope('COMPLETED');
  }
  filledOrders(): Promise<readonly Order[]> {
    return this.scope('FILLED');
  }
  rejectedOrders(): Promise<readonly Order[]> {
    return this.scope('REJECTED');
  }
  cancelledOrders(): Promise<readonly Order[]> {
    return this.scope('CANCELLED');
  }

  async metrics(): Promise<OrderMetrics> {
    return computeOrderMetrics(await this.deps.store.list());
  }

  async health(at: string): Promise<OrderHealth> {
    return computeHealth(await this.deps.store.list(), at);
  }

  async orderTimeline(id: string): Promise<readonly OrderEvent[]> {
    const order = await this.deps.store.getById(id);
    return order ? order.events : [];
  }

  async orderAudit(id: string): Promise<Order['audit']> {
    const order = await this.deps.store.getById(id);
    return order ? order.audit : [];
  }

  async orderHistory(id: string): Promise<OrderHistory | null> {
    const order = await this.deps.store.getById(id);
    return order ? { orderId: order.id, states: order.states, events: order.events } : null;
  }

  async replay(id: string): Promise<ReplayResult | null> {
    const order = await this.deps.store.getById(id);
    return order ? replayOrder(order) : null;
  }

  /* ------------------------------ orchestration ---------------------------- */

  /** Submit a new order request: create → run validation → validated/rejected. Returns the order. */
  async submitOrderRequest(request: OrderRequest, at: string): Promise<Order> {
    const created = createOrder(request, at);
    const validation = validateOrderRequest(request, at);
    const result = validateOrder(created, validation, request.requestedBy, at);
    const order = result.ok ? result.order : created;
    await this.deps.store.save(order);
    await this.publish(order, 'ORDER_SUBMITTED');
    if (order.status === 'REJECTED')
      await this.deps.notifications.notify({
        orderId: order.id,
        channel: 'trading-ops',
        summary: `Order ${order.clientOrderId} rejected at validation.`,
      });
    return order;
  }

  requestApproval(id: string, actor: string, at: string): Promise<OperationResult> {
    return this.run(
      id,
      (order) => requestApproval(order, actor, at),
      async (order) => {
        await this.deps.workflow.scheduleApproval(order.id);
        await this.deps.notifications.notify({
          orderId: order.id,
          channel: 'trading-governance',
          summary: `Approval requested for ${order.clientOrderId}.`,
        });
      },
    );
  }

  decideApproval(
    id: string,
    approved: boolean,
    decidedBy: string,
    at: string,
    rationale?: string,
  ): Promise<OperationResult> {
    return this.run(id, (order) => decideApproval(order, approved, decidedBy, at, rationale));
  }

  queueOrder(id: string, actor: string, at: string): Promise<OperationResult> {
    return this.run(
      id,
      (order) => queueOrder(order, defaultRoute(order.mode), actor, at),
      async (order) => {
        if (order.route) await this.deps.gateway.route(order.id, order.route);
      },
    );
  }

  submitOrder(id: string, actor: string, at: string): Promise<OperationResult> {
    return this.run(
      id,
      (order) => submitOrder(order, actor, at),
      async (order) => {
        await this.deps.gateway.submit(order.id);
      },
    );
  }

  acceptOrder(id: string, actor: string, at: string): Promise<OperationResult> {
    return this.run(id, (order) => acceptOrder(order, actor, at));
  }

  recordFill(id: string, fill: OrderFill, actor: string, at: string): Promise<OperationResult> {
    return this.run(id, (order) => recordFill(order, fill, actor, at));
  }

  expireOrder(id: string, actor: string, at: string): Promise<OperationResult> {
    return this.run(id, (order) => expireOrder(order, actor, at));
  }

  /** Apply a lifecycle action (replace / amend / suspend / resume / cancel / retry). */
  applyAction(
    id: string,
    action: OrderAction,
    actor: string,
    at: string,
    changes?: AmendChanges,
  ): Promise<OperationResult> {
    return this.run(
      id,
      (order) => applyAction(order, action, actor, at, changes),
      async (order) => {
        if (action === 'cancel') await this.deps.gateway.cancel(order.id);
      },
    );
  }

  /** Advance an order one step along the happy path (for orchestration/testing). */
  async advance(id: string, actor: string, at: string): Promise<OperationResult> {
    const order = await this.deps.store.getById(id);
    if (!order) return { ok: false, reason: `unknown order ${id}` };
    switch (order.status) {
      case 'VALIDATED':
        return this.requestApproval(id, actor, at);
      case 'PENDING_APPROVAL':
        return this.decideApproval(id, true, actor, at);
      case 'APPROVED':
        return this.queueOrder(id, actor, at);
      case 'QUEUED':
        return this.submitOrder(id, actor, at);
      case 'SUBMITTED':
        return this.acceptOrder(id, actor, at);
      default:
        return { ok: false, reason: `no happy-path advance from ${order.status}` };
    }
  }

  /* --------------------------------- helpers -------------------------------- */

  private async run(
    id: string,
    apply: (order: Order) => LifecycleResult,
    effects?: (order: Order) => Promise<void>,
  ): Promise<OperationResult> {
    const order = await this.deps.store.getById(id);
    if (!order) return { ok: false, reason: `unknown order ${id}` };
    const result = apply(order);
    if (!result.ok) return { ok: false, reason: result.reason };
    await this.deps.store.save(result.order);
    const last = result.order.events[result.order.events.length - 1];
    await this.deps.audit.record({
      orderId: result.order.id,
      actor: last?.actor ?? 'oms',
      action: last?.type ?? 'UPDATED',
      at: last?.at ?? result.order.updatedAt,
    });
    await this.publish(result.order, last?.type ?? 'UPDATED');
    if (effects) await effects(result.order);
    return { ok: true, order: result.order };
  }

  private async publish(order: Order, type: string): Promise<void> {
    await this.deps.bus.publish({
      id: `${order.id}:${type}:${order.updatedAt}`,
      orderId: order.id,
      type,
      message: `${order.clientOrderId} ${type} (${order.status}).`,
      occurredAt: order.updatedAt,
    });
  }
}

export interface OrderSummary {
  readonly total: number;
  readonly active: number;
  readonly working: number;
  readonly completed: number;
  readonly filled: number;
  readonly rejected: number;
  readonly cancelled: number;
}

/** A small summary derived from a set of orders (for the dashboard header). */
export function summarize(orders: readonly Order[]): OrderSummary {
  return {
    total: orders.length,
    active: orders.filter((o) => isActiveStatus(o.status)).length,
    working: orders.filter((o) => isWorkingStatus(o.status)).length,
    completed: orders.filter((o) => isTerminalStatus(o.status)).length,
    filled: orders.filter((o) => o.status === 'FILLED').length,
    rejected: orders.filter((o) => o.status === 'REJECTED').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
  };
}

export type { OrderStatus };
