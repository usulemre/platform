import { describe, it, expect } from 'vitest';
import {
  maCrossover as sdkMaCrossover,
  rsiThresholdSignal as sdkRsi,
} from '@platform/signal-calculation-sdk';
import { getExecutor, executableSignals } from '../src/domain/executors';
import {
  buildGraph,
  scheduleLevels,
  topoSort,
  isAcyclic,
  featureDependenciesOf,
} from '../src/domain/dependency-graph';
import { generateMetadata } from '../src/domain/metadata';
import { validateResult } from '../src/domain/validation';
import { runBenchmark } from '../src/domain/benchmark';
import { syntheticSeries } from '../src/infrastructure/in-memory/synthetic-data';
import { SignalCalculationService } from '../src/application/signal-calculation-service';
import {
  InMemoryMarketData,
  InMemorySignalCache,
  InMemorySignalResultStore,
  InMemorySignalStore,
  StaticConfiguration,
  StubWorkflow,
} from '../src/infrastructure/in-memory/adapters';

const SERIES = syntheticSeries(500, 0xabc123);

function makeService() {
  let counter = 0;
  let t = 0;
  const signalStore = new InMemorySignalStore();
  const service = new SignalCalculationService({
    marketData: new InMemoryMarketData(),
    signalStore,
    cache: new InMemorySignalCache(),
    resultStore: new InMemorySignalResultStore(),
    workflow: new StubWorkflow(),
    config: new StaticConfiguration(),
    timer: () => (t += 1),
    clock: () => `2026-08-04T00:00:${String(counter).padStart(2, '0')}.000Z`,
    nextId: () => `sig-exec-${(counter += 1)}`,
  });
  return { service, signalStore };
}

describe('executors compute the real SDK signal generators', () => {
  it('the MA-crossover executor equals the SDK maCrossover', () => {
    const output = getExecutor('ma_crossover')(SERIES, { fast: 12, slow: 26 });
    const expected = sdkMaCrossover(SERIES.close, 12, 26);
    expect(output.outputs.signal!.length).toBe(SERIES.length);
    for (let i = 0; i < SERIES.length; i += 1) {
      if (Number.isNaN(expected[i]!)) expect(Number.isNaN(output.outputs.signal![i]!)).toBe(true);
      else expect(output.outputs.signal![i]!).toBe(expected[i]!);
    }
  });

  it('every catalog signal has an executor and produces the dataset length', () => {
    for (const key of executableSignals()) {
      const output = getExecutor(key)(SERIES, {});
      expect(output.length).toBe(SERIES.length);
    }
  });

  it('composite aggregation exposes all its series', () => {
    expect(Object.keys(getExecutor('weighted_aggregate')(SERIES, {}).outputs).sort()).toEqual([
      'confidence',
      'score',
      'signal',
    ]);
    expect(Object.keys(getExecutor('confidence')(SERIES, {}).outputs).sort()).toEqual([
      'confidence',
      'signal',
    ]);
  });

  it('directional signals only emit valid direction values', () => {
    const signal = getExecutor('rsi_threshold')(SERIES, {}).outputs.signal!;
    const expected = sdkRsi(SERIES.close, 14);
    for (let i = 0; i < SERIES.length; i += 1) {
      if (Number.isFinite(signal[i]!)) expect([-1, 0, 1]).toContain(signal[i]!);
      if (!Number.isNaN(expected[i]!)) expect(Number.isNaN(signal[i]!)).toBe(false);
    }
  });
});

describe('dependency graph & scheduler', () => {
  it('topologically orders composites after their base signals', () => {
    const order = topoSort([
      'weighted_aggregate',
      'ma_crossover',
      'macd_crossover',
      'rsi_threshold',
    ]);
    expect(order.indexOf('ma_crossover')).toBeLessThan(order.indexOf('weighted_aggregate'));
    expect(order.indexOf('macd_crossover')).toBeLessThan(order.indexOf('weighted_aggregate'));
  });

  it('groups signals into execution levels', () => {
    const levels = scheduleLevels([
      'weighted_aggregate',
      'ma_crossover',
      'macd_crossover',
      'rsi_threshold',
    ]);
    expect(levels[0]).toContain('ma_crossover');
    expect(levels[levels.length - 1]).toContain('weighted_aggregate');
  });

  it('the full catalog graph is acyclic and exposes feature lineage', () => {
    expect(isAcyclic(executableSignals())).toBe(true);
    expect(
      [
        ...(buildGraph(['composite', 'ma_crossover', 'trend_filter', 'volume_confirmation']).find(
          (n) => n.signalKey === 'composite',
        )?.dependsOn ?? []),
      ].sort(),
    ).toEqual(['ma_crossover', 'trend_filter', 'volume_confirmation']);
    expect(featureDependenciesOf('bollinger_breakout')).toEqual(['bollinger_bands']);
  });
});

describe('validation pipeline (real checks)', () => {
  it('passes length, finite, range, determinism and point-in-time causality', () => {
    const output = getExecutor('ma_crossover')(SERIES, { fast: 12, slow: 26 });
    const report = validateResult('ma_crossover', { fast: 12, slow: 26 }, SERIES, output);
    expect(report.passed).toBe(true);
    expect(report.checks.find((c) => c.id === 'causality')?.passed).toBe(true);
    expect(report.checks.find((c) => c.id === 'range')?.passed).toBe(true);
    expect(report.checks.find((c) => c.id === 'determinism')?.passed).toBe(true);
  });

  it('validates the confidence unit-range signal', () => {
    const output = getExecutor('confidence')(SERIES, {});
    const report = validateResult('confidence', {}, SERIES, output);
    expect(report.passed).toBe(true);
  });
});

describe('metadata generator', () => {
  it('produces a stable manifest hash and a signal distribution', () => {
    const output = getExecutor('ma_crossover')(SERIES, { fast: 12, slow: 26 });
    const m1 = generateMetadata('ma_crossover', { fast: 12, slow: 26 }, 'ds', SERIES, output);
    const m2 = generateMetadata('ma_crossover', { fast: 12, slow: 26 }, 'ds', SERIES, output);
    expect(m1.manifestHash).toBe(m2.manifestHash);
    const m3 = generateMetadata(
      'ma_crossover',
      { fast: 5, slow: 20 },
      'ds',
      SERIES,
      getExecutor('ma_crossover')(SERIES, { fast: 5, slow: 20 }),
    );
    expect(m3.manifestHash).not.toBe(m1.manifestHash);
    expect(m1.longCount + m1.shortCount + m1.flatCount).toBe(m1.finiteCount);
  });
});

describe('benchmark runner', () => {
  it('reports positive throughput', () => {
    const result = runBenchmark(
      'ma_crossover',
      SERIES,
      { fast: 12, slow: 26 },
      { iterations: 20, warmup: 2 },
    );
    expect(result.iterations).toBe(20);
    expect(result.bars).toBe(SERIES.length);
    expect(result.barsPerSecond).toBeGreaterThan(0);
    expect(result.meanMs).toBeGreaterThanOrEqual(0);
  });
});

describe('SignalCalculationService (pipeline over ports)', () => {
  it('executes a signal, registers it and records history', async () => {
    const { service, signalStore } = makeService();
    const { record, result } = await service.executeSignal({
      signalKey: 'ma_crossover',
      params: { fast: 12, slow: 26 },
      datasetRef: 'ds-equity-eod',
    });
    expect(record.status).toBe('COMPLETED');
    expect(record.validationPassed).toBe(true);
    expect(record.cached).toBe(false);
    expect(result?.metadata.finiteCount).toBeGreaterThan(0);
    expect(signalStore.registered.length).toBe(1);
    expect(service.getExecutionHistory().length).toBe(1);
  });

  it('serves the second identical execution from cache', async () => {
    const { service } = makeService();
    await service.executeSignal({ signalKey: 'rsi_threshold', datasetRef: 'ds-equity-eod' });
    const second = await service.executeSignal({
      signalKey: 'rsi_threshold',
      datasetRef: 'ds-equity-eod',
    });
    expect(second.record.cached).toBe(true);
    expect(second.record.durationMs).toBe(0);
  });

  it('reports an unknown dataset as a failed execution (no throw)', async () => {
    const { service } = makeService();
    const { record } = await service.executeSignal({
      signalKey: 'ma_crossover',
      datasetRef: 'nope',
    });
    expect(record.status).toBe('FAILED');
    expect(record.error).toContain('nope');
  });

  it('executes a batch in dependency order and aggregates performance metrics', async () => {
    const { service } = makeService();
    const records = await service.executeBatch([
      { signalKey: 'weighted_aggregate', datasetRef: 'ds-equity-eod' },
      { signalKey: 'ma_crossover', datasetRef: 'ds-equity-eod' },
      { signalKey: 'macd_crossover', datasetRef: 'ds-equity-eod' },
      { signalKey: 'rsi_threshold', datasetRef: 'ds-equity-eod' },
    ]);
    const order = records.map((r) => r.signalKey);
    expect(order.indexOf('ma_crossover')).toBeLessThan(order.indexOf('weighted_aggregate'));
    const metrics = service.getPerformanceMetrics();
    expect(metrics.length).toBe(4);
    expect(metrics.every((m) => m.runs >= 1)).toBe(true);
  });

  it('compares two signals (agreement and correlation)', async () => {
    const { service } = makeService();
    const comparison = await service.compareSignals(
      'ds-equity-eod',
      'ma_crossover',
      'ma_crossover',
    );
    expect(comparison.comparedBars).toBeGreaterThan(0);
    expect(comparison.agreementRatio).toBeCloseTo(1, 9); // a signal always agrees with itself
    expect(comparison.correlation).toBeCloseTo(1, 6);
  });

  it('exposes the catalog, datasets and dependency graph', async () => {
    const { service } = makeService();
    expect(service.listSignals()).toHaveLength(16);
    expect((await service.listDatasets()).length).toBeGreaterThan(0);
    expect(service.dependencyGraph().length).toBe(16);
    const bench = await service.benchmarkSignal('macd_crossover', 'ds-equity-eod', undefined, {
      iterations: 10,
      warmup: 1,
    });
    expect(bench.barsPerSecond).toBeGreaterThan(0);
  });
});
