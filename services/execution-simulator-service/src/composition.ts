/**
 * Composition root for the execution-simulator service. The single place concrete
 * adapters are bound. In v1 only the in-memory mocks are wired; swapping in real
 * infrastructure adapters (Market Data Platform, Simulation Runner, Validation
 * Foundation, Workflow Engine, Event & Messaging Foundation, Audit Center, Notification
 * Center, Configuration Foundation, read stores) requires no application/domain change.
 */
import { ExecutionSimulatorService } from './application/execution-simulator-service';
import {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryNotifications,
  StaticConfiguration,
  StubMarketData,
  StubSimulator,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
import {
  InMemoryComparisonQuery,
  InMemoryFamilyQuery,
  InMemorySessionQuery,
  InMemoryTemplateQuery,
} from './infrastructure/in-memory/repositories';

export function createExecutionSimulatorService(): ExecutionSimulatorService {
  return new ExecutionSimulatorService({
    sessions: new InMemorySessionQuery(),
    families: new InMemoryFamilyQuery(),
    comparisons: new InMemoryComparisonQuery(),
    templates: new InMemoryTemplateQuery(),
    marketData: new StubMarketData(),
    simulator: new StubSimulator(),
    validation: new StubValidation(),
    workflow: new StubWorkflow(),
    bus: new InMemoryEventBus(),
    audit: new InMemoryAudit(),
    notifications: new InMemoryNotifications(),
    config: new StaticConfiguration({ 'execution.default-mode': 'paper' }),
  });
}

export const executionSimulatorService = createExecutionSimulatorService();
