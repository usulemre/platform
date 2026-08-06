/**
 * Composition root for the execution-engine service. The single place concrete adapters are bound. In
 * v1 only the in-memory mocks are wired; swapping in real infrastructure (execution/session stores,
 * Execution Venue / Execution Simulator / Live Trading Platform, OMS, Risk Engine, Workflow Engine,
 * Audit Center, Notification Center, Event & Messaging Foundation, Configuration Foundation) requires
 * no application/domain change.
 */
import { ExecutionEngineService } from './application/execution-engine-service';
import {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryExecutionStore,
  InMemoryNotifications,
  InMemorySessionStore,
  StaticConfiguration,
  StubExecutionVenue,
  StubOms,
  StubRisk,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';

export function createExecutionEngineService(): ExecutionEngineService {
  return new ExecutionEngineService({
    store: new InMemoryExecutionStore(),
    sessions: new InMemorySessionStore(),
    venue: new StubExecutionVenue(),
    oms: new StubOms(),
    risk: new StubRisk(),
    workflow: new StubWorkflow(),
    audit: new InMemoryAudit(),
    notifications: new InMemoryNotifications(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'execution.default-mode': 'SIMULATED' }),
  });
}

export const executionEngineService = createExecutionEngineService();
