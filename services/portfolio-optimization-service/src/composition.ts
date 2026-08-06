/**
 * Composition root for the portfolio-optimization service. Binds the concrete in-memory adapters and
 * the injected timer/clock/id generators. Swapping in real infrastructure (Market Data Platform,
 * Portfolio/Registry store, distributed cache/result store, Workflow Engine, Configuration
 * Foundation) requires no application/domain change. The optimization itself is always the real SDK.
 */
import { performance } from 'node:perf_hooks';
import { PortfolioOptimizationService } from './application/portfolio-optimization-service';
import {
  InMemoryMarketData,
  InMemoryOptimizationCache,
  InMemoryOptimizationResultStore,
  InMemoryOptimizationStore,
  StaticConfiguration,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';

export function createPortfolioOptimizationService(): PortfolioOptimizationService {
  let counter = 0;
  return new PortfolioOptimizationService({
    marketData: new InMemoryMarketData(),
    optimizationStore: new InMemoryOptimizationStore(),
    cache: new InMemoryOptimizationCache(),
    resultStore: new InMemoryOptimizationResultStore(),
    workflow: new StubWorkflow(),
    config: new StaticConfiguration({ 'portfolio-optimization.sdk-version': '1.0.0' }),
    timer: () => performance.now(),
    clock: () => new Date().toISOString(),
    nextId: () => `opt-exec-${(counter += 1).toString(36)}`,
  });
}

export const portfolioOptimizationService = createPortfolioOptimizationService();
