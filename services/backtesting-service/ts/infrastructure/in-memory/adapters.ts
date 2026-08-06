/**
 * In-memory / stub adapters for the backtesting service integration and
 * foundation ports. Development/test only — NO storage, NO cache, NO database,
 * NO broker, NO simulation engine, NO metric computation, NO external calls. They
 * satisfy the port contracts so the application layer can run against synthetic
 * data; swapping in real adapters (Market Data Platform, Simulation Runner,
 * Validation Foundation, Workflow Engine, Event & Messaging Foundation,
 * Configuration Foundation) requires no application/domain change.
 */
import type {
  BacktestEvent,
  ConfigurationPort,
  EventBusPort,
  MarketDataPort,
  SimulationRunnerPort,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { BACKTESTS } from './seed';

/** Market Data Platform — the requested window is assumed available in the mock. */
export class StubMarketData implements MarketDataPort {
  async isWindowAvailable(): Promise<boolean> {
    return true;
  }
}

/** Simulation Runner — records intent only; NEVER runs a simulation here. */
export class StubSimulationRunner implements SimulationRunnerPort {
  async enqueue(): Promise<void> {
    /* no-op: the external runner executes the simulation. */
  }
  async cancel(): Promise<void> {
    /* no-op */
  }
  async pause(): Promise<void> {
    /* no-op */
  }
  async resume(): Promise<void> {
    /* no-op */
  }
}

/** Validation Foundation — a backtest is validated when it recorded PASSED. */
export class StubValidation implements ValidationPort {
  async isValidated(backtestId: string): Promise<boolean> {
    return BACKTESTS.find((backtest) => backtest.id === backtestId)?.validation.status === 'PASSED';
  }
}

/** Workflow Engine — records scheduling intent only. */
export class StubWorkflow implements WorkflowPort {
  async scheduleRun(): Promise<void> {
    /* no-op */
  }
  async scheduleReview(): Promise<void> {
    /* no-op */
  }
  async scheduleApproval(): Promise<void> {
    /* no-op */
  }
}

/** Event & Messaging Foundation — collects published events in memory. */
export class InMemoryEventBus implements EventBusPort {
  readonly published: BacktestEvent[] = [];
  async publish(event: BacktestEvent): Promise<void> {
    this.published.push(event);
  }
}

/** Configuration Foundation — static, non-secret configuration by key. */
export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
