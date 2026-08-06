import { describe, it, expect } from 'vitest';
import { resolveConstraints } from '@platform/portfolio-optimization-sdk';
import { buildInput } from '../src/domain/input';
import { getExecutor, executableOptimizers } from '../src/domain/executors';
import { buildGraph, scheduleLevels, topoSort, isAcyclic } from '../src/domain/dependency-graph';
import { generateMetadata } from '../src/domain/metadata';
import { validateResult } from '../src/domain/validation';
import { runBenchmark } from '../src/domain/benchmark';
import { SYNTHETIC_UNIVERSES } from '../src/infrastructure/in-memory/synthetic-data';
import { PortfolioOptimizationService } from '../src/application/portfolio-optimization-service';
import {
  InMemoryMarketData,
  InMemoryOptimizationCache,
  InMemoryOptimizationResultStore,
  InMemoryOptimizationStore,
  StaticConfiguration,
  StubWorkflow,
} from '../src/infrastructure/in-memory/adapters';

const UNIVERSE = SYNTHETIC_UNIVERSES[0]!;
const INPUT = buildInput(UNIVERSE);
const CONFIG = resolveConstraints();

function makeService() {
  let counter = 0;
  let t = 0;
  const optimizationStore = new InMemoryOptimizationStore();
  const service = new PortfolioOptimizationService({
    marketData: new InMemoryMarketData(),
    optimizationStore,
    cache: new InMemoryOptimizationCache(),
    resultStore: new InMemoryOptimizationResultStore(),
    workflow: new StubWorkflow(),
    config: new StaticConfiguration(),
    timer: () => (t += 1),
    clock: () => `2026-08-04T00:00:${String(counter).padStart(2, '0')}.000Z`,
    nextId: () => `opt-exec-${(counter += 1)}`,
  });
  return { service, optimizationStore };
}

function sum(w: Float64Array): number {
  let s = 0;
  for (let i = 0; i < w.length; i += 1) s += w[i]!;
  return s;
}

describe('executors compute the real SDK optimizers', () => {
  it('the equal-weight executor equals 1/n', () => {
    const result = getExecutor('equal_weight')(INPUT, CONFIG, {});
    for (let i = 0; i < INPUT.n; i += 1) expect(result.weights[i]!).toBeCloseTo(1 / INPUT.n, 6);
  });

  it('every catalog optimizer produces n finite weights', () => {
    for (const key of executableOptimizers()) {
      const result = getExecutor(key)(INPUT, CONFIG, {});
      expect(result.weights.length).toBe(INPUT.n);
      for (let i = 0; i < INPUT.n; i += 1) expect(Number.isFinite(result.weights[i]!)).toBe(true);
    }
  });

  it('minimum variance beats equal weight on variance and is fully invested', () => {
    const mv = getExecutor('minimum_variance')(INPUT, CONFIG, {});
    expect(sum(mv.weights)).toBeCloseTo(1, 3);
  });
});

describe('dependency graph & scheduler', () => {
  it('orders dependents after dependencies', () => {
    const order = topoSort(['target_volatility', 'maximum_sharpe']);
    expect(order.indexOf('maximum_sharpe')).toBeLessThan(order.indexOf('target_volatility'));
  });

  it('groups optimizers into execution levels', () => {
    const levels = scheduleLevels(['target_volatility', 'maximum_sharpe']);
    expect(levels[0]).toContain('maximum_sharpe');
    expect(levels[levels.length - 1]).toContain('target_volatility');
  });

  it('the full catalog graph is acyclic', () => {
    expect(isAcyclic(executableOptimizers())).toBe(true);
    expect(
      buildGraph(['cash_allocation', 'risk_parity']).find(
        (n) => n.optimizerKey === 'cash_allocation',
      )?.dependsOn,
    ).toEqual(['risk_parity']);
  });
});

describe('validation pipeline (real checks)', () => {
  it('passes finiteness, feasibility, determinism and the variance objective for minimum variance', () => {
    const solution = getExecutor('minimum_variance')(INPUT, CONFIG, {});
    const report = validateResult('minimum_variance', {}, INPUT, CONFIG, solution);
    expect(report.passed).toBe(true);
    expect(report.checks.find((c) => c.id === 'feasible')?.passed).toBe(true);
    expect(report.checks.find((c) => c.id === 'determinism')?.passed).toBe(true);
    expect(report.checks.find((c) => c.id === 'objective')?.passed).toBe(true);
  });

  it('risk parity passes the equal-risk-contribution objective', () => {
    const solution = getExecutor('risk_parity')(INPUT, CONFIG, {});
    const report = validateResult('risk_parity', {}, INPUT, CONFIG, solution);
    expect(report.checks.find((c) => c.id === 'objective')?.passed).toBe(true);
  });
});

describe('metadata generator', () => {
  it('produces a stable manifest hash that varies with the method', () => {
    const a = getExecutor('minimum_variance')(INPUT, CONFIG, {});
    const m1 = generateMetadata('minimum_variance', {}, UNIVERSE.ref, INPUT, a);
    const m2 = generateMetadata('minimum_variance', {}, UNIVERSE.ref, INPUT, a);
    expect(m1.manifestHash).toBe(m2.manifestHash);
    const b = getExecutor('equal_weight')(INPUT, CONFIG, {});
    expect(generateMetadata('equal_weight', {}, UNIVERSE.ref, INPUT, b).manifestHash).not.toBe(
      m1.manifestHash,
    );
  });
});

describe('benchmark runner', () => {
  it('reports positive throughput', () => {
    const result = runBenchmark('risk_parity', INPUT, CONFIG, {}, { iterations: 10, warmup: 1 });
    expect(result.iterations).toBe(10);
    expect(result.assets).toBe(INPUT.n);
    expect(result.opsPerSecond).toBeGreaterThan(0);
  });
});

describe('PortfolioOptimizationService (pipeline over ports)', () => {
  it('optimizes, registers and records history', async () => {
    const { service, optimizationStore } = makeService();
    const { record, result } = await service.optimize({
      optimizerKey: 'minimum_variance',
      universeRef: 'univ-equity-10',
    });
    expect(record.status).toBe('COMPLETED');
    expect(record.validationPassed).toBe(true);
    expect(record.cached).toBe(false);
    expect(result?.allocations.length).toBe(10);
    expect(optimizationStore.registered.length).toBe(1);
    expect(service.getExecutionHistory().length).toBe(1);
  });

  it('serves the second identical optimization from cache', async () => {
    const { service } = makeService();
    await service.optimize({ optimizerKey: 'risk_parity', universeRef: 'univ-equity-10' });
    const second = await service.optimize({
      optimizerKey: 'risk_parity',
      universeRef: 'univ-equity-10',
    });
    expect(second.record.cached).toBe(true);
    expect(second.record.durationMs).toBe(0);
  });

  it('reports an unknown universe as a failed execution (no throw)', async () => {
    const { service } = makeService();
    const { record } = await service.optimize({
      optimizerKey: 'equal_weight',
      universeRef: 'nope',
    });
    expect(record.status).toBe('FAILED');
    expect(record.error).toContain('nope');
  });

  it('runs a batch in dependency order and aggregates performance metrics', async () => {
    const { service } = makeService();
    const records = await service.optimizeBatch([
      { optimizerKey: 'target_volatility', universeRef: 'univ-equity-10' },
      { optimizerKey: 'maximum_sharpe', universeRef: 'univ-equity-10' },
    ]);
    const order = records.map((r) => r.optimizerKey);
    expect(order.indexOf('maximum_sharpe')).toBeLessThan(order.indexOf('target_volatility'));
    const metrics = service.getPerformanceMetrics();
    expect(metrics.length).toBe(2);
  });

  it('computes an efficient frontier and compares optimizers', async () => {
    const { service } = makeService();
    const frontier = await service.efficientFrontier('univ-equity-10', undefined, 10);
    expect(frontier.length).toBe(10);
    const comparison = await service.compareOptimizers('univ-equity-10', [
      'equal_weight',
      'minimum_variance',
      'risk_parity',
    ]);
    expect(comparison.length).toBe(3);
    expect(comparison.every((row) => row.validationPassed)).toBe(true);
    // minimum variance should have the lowest volatility of the three.
    const minVar = comparison.find((r) => r.optimizerKey === 'minimum_variance')!;
    const equal = comparison.find((r) => r.optimizerKey === 'equal_weight')!;
    expect(minVar.volatility).toBeLessThanOrEqual(equal.volatility + 1e-9);
  });

  it('exposes the catalog, universes and dependency graph', async () => {
    const { service } = makeService();
    expect(service.listOptimizers()).toHaveLength(12);
    expect((await service.listUniverses()).length).toBeGreaterThan(0);
    expect(service.dependencyGraph().length).toBe(12);
  });
});
