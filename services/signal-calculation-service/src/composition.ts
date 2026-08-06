/**
 * Composition root for the signal-calculation service. Binds the concrete in-memory adapters and the
 * injected timer/clock/id generators. Swapping in real infrastructure (Market Data Platform, Signal
 * Registry, distributed cache/result store, Workflow Engine, Configuration Foundation) requires no
 * application/domain change. The signal generation itself is always the real SDK one.
 */
import { performance } from 'node:perf_hooks';
import { SignalCalculationService } from './application/signal-calculation-service';
import {
  InMemoryMarketData,
  InMemorySignalCache,
  InMemorySignalResultStore,
  InMemorySignalStore,
  StaticConfiguration,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';

export function createSignalCalculationService(): SignalCalculationService {
  let counter = 0;
  return new SignalCalculationService({
    marketData: new InMemoryMarketData(),
    signalStore: new InMemorySignalStore(),
    cache: new InMemorySignalCache(),
    resultStore: new InMemorySignalResultStore(),
    workflow: new StubWorkflow(),
    config: new StaticConfiguration({ 'signal-calculation.sdk-version': '1.0.0' }),
    timer: () => performance.now(),
    clock: () => new Date().toISOString(),
    nextId: () => `sig-exec-${(counter += 1).toString(36)}`,
  });
}

export const signalCalculationService = createSignalCalculationService();
