/**
 * Composition root for the order-management service. The single place concrete adapters are bound. In
 * v1 only the in-memory mocks are wired; swapping in real infrastructure (order store, Execution
 * Gateway / Execution Simulator / Live Trading Platform, Risk Engine, Workflow Engine, Audit Center,
 * Notification Center, Event & Messaging Foundation, Configuration Foundation) requires no
 * application/domain change.
 */
import { OrderManagementService } from './application/order-management-service';
import {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryNotifications,
  InMemoryOrderStore,
  StaticConfiguration,
  StubExecutionGateway,
  StubRisk,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';

export function createOrderManagementService(): OrderManagementService {
  return new OrderManagementService({
    store: new InMemoryOrderStore(),
    gateway: new StubExecutionGateway(),
    risk: new StubRisk(),
    workflow: new StubWorkflow(),
    audit: new InMemoryAudit(),
    notifications: new InMemoryNotifications(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'oms.default-mode': 'PAPER' }),
  });
}

export const orderManagementService = createOrderManagementService();
