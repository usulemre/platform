import { describe, it, expect } from 'vitest';
import { sma as sdkSma, zScore as sdkZScore } from '@platform/feature-calculation-sdk';
import { getExecutor, executableFeatures } from '../src/domain/executors';
import { buildGraph, scheduleLevels, topoSort, isAcyclic } from '../src/domain/dependency-graph';
import { generateMetadata } from '../src/domain/metadata';
import { validateResult } from '../src/domain/validation';
import { runBenchmark } from '../src/domain/benchmark';
import { syntheticSeries } from '../src/infrastructure/in-memory/synthetic-data';
import { FeatureCalculationService } from '../src/application/feature-calculation-service';
import {
  InMemoryFeatureCache,
  InMemoryFeatureResultStore,
  InMemoryFeatureStore,
  InMemoryMarketData,
  StaticConfiguration,
  StubWorkflow,
} from '../src/infrastructure/in-memory/adapters';

const SERIES = syntheticSeries(500, 0xabc123);

function makeService() {
  let counter = 0;
  let t = 0;
  const featureStore = new InMemoryFeatureStore();
  const service = new FeatureCalculationService({
    marketData: new InMemoryMarketData(),
    featureStore,
    cache: new InMemoryFeatureCache(),
    resultStore: new InMemoryFeatureResultStore(),
    workflow: new StubWorkflow(),
    config: new StaticConfiguration(),
    timer: () => (t += 1),
    clock: () => `2026-08-04T00:00:${String(counter).padStart(2, '0')}.000Z`,
    nextId: () => `exec-${(counter += 1)}`,
  });
  return { service, featureStore };
}

describe('executors compute the real SDK calculations', () => {
  it('the SMA executor equals the SDK sma over the same window', () => {
    const output = getExecutor('sma')(SERIES, { window: 20 });
    const expected = sdkSma(SERIES.close, 20);
    expect(output.outputs.sma!.length).toBe(SERIES.length);
    for (let i = 0; i < SERIES.length; i += 1) {
      if (Number.isNaN(expected[i]!)) expect(Number.isNaN(output.outputs.sma![i]!)).toBe(true);
      else expect(output.outputs.sma![i]!).toBeCloseTo(expected[i]!, 9);
    }
  });

  it('every catalog feature has an executor and produces the dataset length', () => {
    for (const key of executableFeatures()) {
      const output = getExecutor(key)(SERIES, {});
      expect(output.length).toBe(SERIES.length);
    }
  });

  it('multi-output features expose all their series', () => {
    expect(Object.keys(getExecutor('macd')(SERIES, {}).outputs).sort()).toEqual([
      'histogram',
      'macd',
      'signal',
    ]);
    expect(Object.keys(getExecutor('bollinger_bands')(SERIES, {}).outputs).sort()).toEqual([
      'lower',
      'middle',
      'upper',
    ]);
  });
});

describe('dependency graph & scheduler', () => {
  it('topologically orders dependents after dependencies', () => {
    const order = topoSort(['zscore', 'rolling_std', 'rolling_mean', 'rolling_variance']);
    expect(order.indexOf('rolling_variance')).toBeLessThan(order.indexOf('rolling_std'));
    expect(order.indexOf('rolling_std')).toBeLessThan(order.indexOf('zscore'));
    expect(order.indexOf('rolling_mean')).toBeLessThan(order.indexOf('zscore'));
  });

  it('groups features into execution levels', () => {
    const levels = scheduleLevels(['zscore', 'rolling_std', 'rolling_variance']);
    expect(levels[0]).toContain('rolling_variance');
    expect(levels[levels.length - 1]).toContain('zscore');
  });

  it('the full catalog graph is acyclic', () => {
    expect(isAcyclic(executableFeatures())).toBe(true);
    expect(buildGraph(['macd', 'ema']).find((n) => n.featureKey === 'macd')?.dependsOn).toEqual([
      'ema',
    ]);
  });
});

describe('validation pipeline (real checks)', () => {
  it('passes length, finite, determinism and point-in-time causality', () => {
    const output = getExecutor('zscore')(SERIES, { window: 20 });
    const report = validateResult('zscore', { window: 20 }, SERIES, output);
    expect(report.passed).toBe(true);
    expect(report.checks.find((c) => c.id === 'causality')?.passed).toBe(true);
    expect(report.checks.find((c) => c.id === 'determinism')?.passed).toBe(true);
    // sanity: the z-score executor really is the SDK z-score
    const expected = sdkZScore(SERIES.close, 20);
    expect(output.outputs.zscore![100]!).toBeCloseTo(expected[100]!, 9);
  });
});

describe('metadata generator', () => {
  it('produces a stable manifest hash for identical inputs', () => {
    const output = getExecutor('sma')(SERIES, { window: 20 });
    const m1 = generateMetadata('sma', { window: 20 }, 'ds', SERIES, output);
    const m2 = generateMetadata('sma', { window: 20 }, 'ds', SERIES, output);
    expect(m1.manifestHash).toBe(m2.manifestHash);
    const m3 = generateMetadata(
      'sma',
      { window: 30 },
      'ds',
      SERIES,
      getExecutor('sma')(SERIES, { window: 30 }),
    );
    expect(m3.manifestHash).not.toBe(m1.manifestHash);
    expect(m1.warmup).toBe(19);
  });
});

describe('benchmark runner', () => {
  it('reports positive throughput', () => {
    const result = runBenchmark('sma', SERIES, { window: 20 }, { iterations: 20, warmup: 2 });
    expect(result.iterations).toBe(20);
    expect(result.bars).toBe(SERIES.length);
    expect(result.barsPerSecond).toBeGreaterThan(0);
    expect(result.meanMs).toBeGreaterThanOrEqual(0);
  });
});

describe('FeatureCalculationService (pipeline over ports)', () => {
  it('executes a feature, registers it and records history', async () => {
    const { service, featureStore } = makeService();
    const { record, result } = await service.executeFeature({
      featureKey: 'sma',
      params: { window: 20 },
      datasetRef: 'ds-equity-eod',
    });
    expect(record.status).toBe('COMPLETED');
    expect(record.validationPassed).toBe(true);
    expect(record.cached).toBe(false);
    expect(result?.metadata.finiteCount).toBeGreaterThan(0);
    expect(featureStore.registered.length).toBe(1);
    expect(service.getExecutionHistory().length).toBe(1);
  });

  it('serves the second identical execution from cache', async () => {
    const { service } = makeService();
    await service.executeFeature({ featureKey: 'ema', datasetRef: 'ds-equity-eod' });
    const second = await service.executeFeature({ featureKey: 'ema', datasetRef: 'ds-equity-eod' });
    expect(second.record.cached).toBe(true);
    expect(second.record.durationMs).toBe(0);
  });

  it('reports an unknown dataset as a failed execution (no throw)', async () => {
    const { service } = makeService();
    const { record } = await service.executeFeature({ featureKey: 'sma', datasetRef: 'nope' });
    expect(record.status).toBe('FAILED');
    expect(record.error).toContain('nope');
  });

  it('executes a batch in dependency order and aggregates performance metrics', async () => {
    const { service } = makeService();
    const records = await service.executeBatch([
      { featureKey: 'zscore', datasetRef: 'ds-equity-eod' },
      { featureKey: 'rolling_std', datasetRef: 'ds-equity-eod' },
      { featureKey: 'rolling_mean', datasetRef: 'ds-equity-eod' },
    ]);
    const order = records.map((r) => r.featureKey);
    expect(order.indexOf('rolling_std')).toBeLessThan(order.indexOf('zscore'));
    const metrics = service.getPerformanceMetrics();
    expect(metrics.length).toBe(3);
    expect(metrics.every((m) => m.runs >= 1)).toBe(true);
  });

  it('exposes the catalog, datasets and dependency graph', async () => {
    const { service } = makeService();
    expect(service.listCalculations()).toHaveLength(22);
    expect((await service.listDatasets()).length).toBeGreaterThan(0);
    expect(service.dependencyGraph().length).toBe(22);
    const bench = await service.benchmarkFeature(
      'rsi',
      'ds-equity-eod',
      { window: 14 },
      { iterations: 10, warmup: 1 },
    );
    expect(bench.barsPerSecond).toBeGreaterThan(0);
  });
});
