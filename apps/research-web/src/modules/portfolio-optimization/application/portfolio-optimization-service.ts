/**
 * Portfolio Optimization application service — the ONLY layer the UI/hooks call. Orchestrates the
 * repository (which runs the REAL SDK optimizers) and maps results to view models. No optimization
 * logic and no business logic here — presentation mapping only.
 */
import {
  OPTIMIZER_CATALOG,
  describeOptimizer,
  type OptimizerKey,
} from '@platform/portfolio-optimization-sdk';
import type {
  BenchmarkRow,
  ComparisonRowDto,
  DependencyNode,
  ExecutionRecord,
  FrontierPointDto,
  OptimizationResultDto,
  OptimizeRequest,
  PerformanceRow,
  PortfolioOptimizationRepository,
} from '../data/repository';
import type { ConstraintDto } from '../data/runner';
import type {
  BenchmarkRowVm,
  ComparisonRowVm,
  DependencyNodeVm,
  ExecutionRecordVm,
  FrontierPointVm,
  MetricsVm,
  OptimizationResultVm,
  OptimizerGroupVm,
  OptimizerVm,
  PerformanceRowVm,
  PortfolioOptimizationSummaryVm,
  Tone,
  UniverseVm,
} from '../domain/view-model';

function labelFor(key: string): string {
  return describeOptimizer(key as OptimizerKey)?.label ?? key;
}

function categoryFor(key: string): string {
  return describeOptimizer(key as OptimizerKey)?.category ?? 'NAIVE';
}

function pct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function retPct(v: number): string {
  return `${(v * 100).toFixed(3)}%`;
}

function num(v: number, dp = 3): string {
  if (!Number.isFinite(v)) return '∞';
  return v.toFixed(dp);
}

function ms(v: number): string {
  return `${v.toFixed(3)} ms`;
}

function count(v: number): string {
  if (!Number.isFinite(v)) return '∞';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toFixed(0);
}

function paramSummary(params: Readonly<Record<string, number>>): string {
  const entries = Object.entries(params);
  return entries.length === 0 ? '—' : entries.map(([name, value]) => `${name}=${value}`).join(', ');
}

function checkTone(passed: boolean): Tone {
  return passed ? 'positive' : 'danger';
}

function toOptimizerVm(key: string): OptimizerVm {
  const descriptor = describeOptimizer(key as OptimizerKey)!;
  return {
    key: descriptor.key,
    label: descriptor.label,
    category: descriptor.category,
    params: descriptor.params.map((p) => ({
      name: p.name,
      label: p.label,
      defaultValue: p.defaultValue,
      min: p.min,
      max: p.max,
      integer: p.integer,
    })),
    usesSignals: descriptor.usesSignals,
    usesPrevious: descriptor.usesPrevious,
    iterative: descriptor.iterative,
    description: descriptor.description,
  };
}

function toMetricsVm(metrics: OptimizationResultDto['metrics']): MetricsVm {
  return {
    expectedReturn: retPct(metrics.expectedReturn),
    volatility: retPct(metrics.volatility),
    sharpe: num(metrics.sharpe),
    diversificationRatio: num(metrics.diversificationRatio, 2),
    effectiveAssets: num(metrics.effectiveAssets, 2),
    maxWeight: pct(metrics.maxWeight),
    grossLeverage: num(metrics.grossLeverage, 2),
    netExposure: pct(metrics.netExposure),
    turnover: num(metrics.turnover, 3),
  };
}

function toResultVm(result: OptimizationResultDto): OptimizationResultVm {
  const mapChecks = (checks: OptimizationResultDto['checks']) =>
    checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: {
        value: check.id,
        label: check.passed ? 'Pass' : 'Fail',
        tone: checkTone(check.passed),
      },
      detail: check.detail,
    }));
  return {
    optimizerKey: result.optimizerKey,
    label: labelFor(result.optimizerKey),
    universeRef: result.universeRef,
    paramSummary: paramSummary(result.params),
    allocations: result.allocations.map((allocation) => ({
      asset: allocation.asset,
      weightPct: pct(allocation.weight),
      weightRaw: allocation.weight,
      riskContributionPct: pct(allocation.riskContribution),
      sector: allocation.sector ?? '—',
    })),
    cashWeightPct: pct(result.cashWeight),
    metrics: toMetricsVm(result.metrics),
    iterations: result.iterations,
    converged: result.converged,
    durationMs: ms(result.durationMs),
    manifestHash: result.manifestHash,
    validationPassed: result.validationPassed,
    checks: mapChecks(result.checks),
    constraintChecks: mapChecks(result.constraintChecks),
  };
}

function toExecutionVm(record: ExecutionRecord): ExecutionRecordVm {
  const failed = record.status === 'FAILED';
  return {
    id: record.id,
    optimizerLabel: labelFor(record.optimizerKey),
    optimizerKey: record.optimizerKey,
    universeRef: record.universeRef,
    status: {
      value: record.status,
      label: failed ? 'Failed' : 'Completed',
      tone: failed ? 'danger' : 'positive',
    },
    durationMs: ms(record.durationMs),
    volatility: retPct(record.volatility),
    sharpe: num(record.sharpe),
    iterations: record.iterations,
    converged: record.converged,
    cached: record.cached,
    validationPassed: record.validationPassed,
    atLabel: record.at.slice(0, 19).replace('T', ' '),
  };
}

function toFrontierVm(point: FrontierPointDto): FrontierPointVm {
  return {
    riskAversion: num(point.riskAversion, 2),
    volatility: point.volatility,
    expectedReturn: point.expectedReturn,
    volatilityLabel: retPct(point.volatility),
    expectedReturnLabel: retPct(point.expectedReturn),
    sharpe: num(point.sharpe),
    isMaxSharpe: point.isMaxSharpe,
  };
}

function toComparisonVm(row: ComparisonRowDto): ComparisonRowVm {
  return {
    optimizerKey: row.optimizerKey,
    label: labelFor(row.optimizerKey),
    category: categoryFor(row.optimizerKey),
    expectedReturn: retPct(row.expectedReturn),
    volatility: retPct(row.volatility),
    sharpe: num(row.sharpe),
    diversificationRatio: num(row.diversificationRatio, 2),
    effectiveAssets: num(row.effectiveAssets, 2),
    maxWeight: pct(row.maxWeight),
    turnover: num(row.turnover, 3),
    validationPassed: row.validationPassed,
  };
}

function toBenchmarkVm(row: BenchmarkRow): BenchmarkRowVm {
  return {
    optimizerKey: row.optimizerKey,
    label: labelFor(row.optimizerKey),
    category: categoryFor(row.optimizerKey),
    assets: row.assets,
    meanMs: ms(row.meanMs),
    opsPerSecond: count(row.opsPerSecond),
  };
}

function toPerformanceVm(row: PerformanceRow): PerformanceRowVm {
  return {
    optimizerKey: row.optimizerKey,
    label: labelFor(row.optimizerKey),
    runs: row.runs,
    meanDurationMs: ms(row.meanDurationMs),
    meanIterations: num(row.meanIterations, 1),
  };
}

function toDependencyVm(node: DependencyNode): DependencyNodeVm {
  return {
    optimizerKey: node.optimizerKey,
    label: labelFor(node.optimizerKey),
    level: node.level,
    dependsOn: node.dependsOn.map(labelFor),
  };
}

export class PortfolioOptimizationAdminService {
  constructor(private readonly repository: PortfolioOptimizationRepository) {}

  async getSummary(): Promise<PortfolioOptimizationSummaryVm> {
    const [universes, history] = await Promise.all([
      this.repository.listUniverses(),
      this.repository.getExecutionHistory(),
    ]);
    const categories = new Map<string, number>();
    for (const descriptor of OPTIMIZER_CATALOG)
      categories.set(descriptor.category, (categories.get(descriptor.category) ?? 0) + 1);
    return {
      totalOptimizers: OPTIMIZER_CATALOG.length,
      categories: categories.size,
      universes: universes.length,
      executions: history.length,
      byCategory: [...categories.entries()].map(([category, c]) => ({ category, count: c })),
    };
  }

  async listOptimizers(): Promise<OptimizerGroupVm[]> {
    const byCategory = new Map<string, OptimizerVm[]>();
    for (const descriptor of OPTIMIZER_CATALOG) {
      const list = byCategory.get(descriptor.category) ?? [];
      list.push(toOptimizerVm(descriptor.key));
      byCategory.set(descriptor.category, list);
    }
    return [...byCategory.entries()].map(([category, optimizers]) => ({ category, optimizers }));
  }

  async listUniverses(): Promise<UniverseVm[]> {
    return (await this.repository.listUniverses()).map((universe) => ({
      ref: universe.ref,
      label: universe.label,
      assets: universe.assets,
      periods: universe.periods,
    }));
  }

  async optimize(request: OptimizeRequest): Promise<OptimizationResultVm> {
    return toResultVm(await this.repository.optimize(request));
  }

  async efficientFrontier(
    universeRef: string,
    constraints: ConstraintDto,
    points?: number,
  ): Promise<FrontierPointVm[]> {
    return (await this.repository.efficientFrontier(universeRef, constraints, points)).map(
      toFrontierVm,
    );
  }

  async compareOptimizers(
    universeRef: string,
    keys: readonly OptimizerKey[],
    constraints: ConstraintDto,
  ): Promise<ComparisonRowVm[]> {
    return (await this.repository.compareOptimizers(universeRef, keys, constraints)).map(
      toComparisonVm,
    );
  }

  async getExecutionHistory(): Promise<ExecutionRecordVm[]> {
    return (await this.repository.getExecutionHistory()).map(toExecutionVm);
  }

  async getExecutionStatus(limit = 10): Promise<ExecutionRecordVm[]> {
    return (await this.repository.getExecutionHistory()).slice(0, limit).map(toExecutionVm);
  }

  async runBenchmarkSuite(universeRef: string): Promise<BenchmarkRowVm[]> {
    return (await this.repository.runBenchmarkSuite(universeRef)).map(toBenchmarkVm);
  }

  async getPerformanceMetrics(): Promise<PerformanceRowVm[]> {
    return (await this.repository.getPerformanceMetrics()).map(toPerformanceVm);
  }

  async dependencyGraph(): Promise<DependencyNodeVm[]> {
    return (await this.repository.dependencyGraph()).map(toDependencyVm);
  }
}
