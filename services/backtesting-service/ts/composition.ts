/**
 * Composition root for the backtesting service. The single place concrete
 * adapters are bound. In v1 only the in-memory mocks are wired; swapping in real
 * infrastructure adapters (Market Data Platform, Simulation Runner, Validation
 * Foundation, Workflow Engine, Event & Messaging Foundation, Configuration
 * Foundation, read stores) requires no application/domain change.
 */
import { BacktestingService } from './application/backtesting-service';
import {
  InMemoryEventBus,
  StaticConfiguration,
  StubMarketData,
  StubSimulationRunner,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
import {
  InMemoryBacktestQuery,
  InMemoryComparisonQuery,
  InMemoryFamilyQuery,
} from './infrastructure/in-memory/repositories';

export function createBacktestingService(): BacktestingService {
  return new BacktestingService({
    backtests: new InMemoryBacktestQuery(),
    families: new InMemoryFamilyQuery(),
    comparisons: new InMemoryComparisonQuery(),
    marketData: new StubMarketData(),
    runner: new StubSimulationRunner(),
    validation: new StubValidation(),
    workflow: new StubWorkflow(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'backtesting.default-scenario': 'HISTORICAL' }),
  });
}

export const backtestingService = createBacktestingService();
