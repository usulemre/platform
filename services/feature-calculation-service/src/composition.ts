/**
 * Composition root for the feature-calculation service. Binds the concrete in-memory adapters and
 * the injected timer/clock/id generators. Swapping in real infrastructure (Market Data Platform,
 * Feature Store, distributed cache/result store, Workflow Engine, Configuration Foundation)
 * requires no application/domain change. The calculations themselves are always the real SDK ones.
 */
import { performance } from 'node:perf_hooks';
import { FeatureCalculationService } from './application/feature-calculation-service';
import {
  InMemoryFeatureCache,
  InMemoryFeatureResultStore,
  InMemoryFeatureStore,
  InMemoryMarketData,
  StaticConfiguration,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';

export function createFeatureCalculationService(): FeatureCalculationService {
  let counter = 0;
  return new FeatureCalculationService({
    marketData: new InMemoryMarketData(),
    featureStore: new InMemoryFeatureStore(),
    cache: new InMemoryFeatureCache(),
    resultStore: new InMemoryFeatureResultStore(),
    workflow: new StubWorkflow(),
    config: new StaticConfiguration({ 'feature-calculation.sdk-version': '1.0.0' }),
    timer: () => performance.now(),
    clock: () => new Date().toISOString(),
    nextId: () => `exec-${(counter += 1).toString(36)}`,
  });
}

export const featureCalculationService = createFeatureCalculationService();
