/**
 * In-memory / stub adapters for the portfolio-construction service integration and
 * foundation ports. Development/test only — NO storage, NO cache, NO database, NO
 * broker, NO optimizer, NO weight/risk computation, NO external calls. They satisfy
 * the port contracts so the application layer can run against synthetic data;
 * swapping in real adapters (Market Data Platform, Optimizer, Risk module, Validation
 * Foundation, Workflow Engine, Event & Messaging Foundation, Configuration
 * Foundation) requires no application/domain change.
 */
import type {
  ConfigurationPort,
  EventBusPort,
  MarketDataPort,
  OptimizerPort,
  PortfolioEvent,
  RiskPort,
  ValidationPort,
  WorkflowPort,
} from '../ports';
import { PORTFOLIOS } from './seed';

/** Market Data Platform — the requested universe is assumed available in the mock. */
export class StubMarketData implements MarketDataPort {
  async isUniverseAvailable(): Promise<boolean> {
    return true;
  }
}

/** Optimizer — records intent only; NEVER optimizes or computes weights here. */
export class StubOptimizer implements OptimizerPort {
  async requestOptimization(): Promise<void> {
    /* no-op: the external optimizer performs the optimization. */
  }
  async cancelOptimization(): Promise<void> {
    /* no-op */
  }
}

/** Risk module — a portfolio is risk-cleared when its recorded constraints are satisfied. */
export class StubRisk implements RiskPort {
  async isRiskCleared(portfolioId: string): Promise<boolean> {
    const portfolio = PORTFOLIOS.find((candidate) => candidate.id === portfolioId);
    return (
      !!portfolio && portfolio.constraints.every((constraint) => constraint.status !== 'VIOLATED')
    );
  }
}

/** Validation Foundation — a portfolio is validated when it recorded PASSED. */
export class StubValidation implements ValidationPort {
  async isValidated(portfolioId: string): Promise<boolean> {
    return (
      PORTFOLIOS.find((portfolio) => portfolio.id === portfolioId)?.validation.status === 'PASSED'
    );
  }
}

/** Workflow Engine — records scheduling intent only. */
export class StubWorkflow implements WorkflowPort {
  async scheduleOptimization(): Promise<void> {
    /* no-op */
  }
  async scheduleReview(): Promise<void> {
    /* no-op */
  }
  async scheduleApproval(): Promise<void> {
    /* no-op */
  }
  async scheduleRebalance(): Promise<void> {
    /* no-op */
  }
}

/** Event & Messaging Foundation — collects published events in memory. */
export class InMemoryEventBus implements EventBusPort {
  readonly published: PortfolioEvent[] = [];
  async publish(event: PortfolioEvent): Promise<void> {
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
