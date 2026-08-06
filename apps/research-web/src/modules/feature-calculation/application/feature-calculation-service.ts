/**
 * Feature Calculation application service — the ONLY layer the UI/hooks call. Orchestrates the
 * repository (which runs the REAL SDK calculations) and maps results to view models. No
 * calculation logic and no business logic here — presentation mapping only.
 */
import {
  FEATURE_CATALOG,
  describeFeature,
  type FeatureKey,
} from '@platform/feature-calculation-sdk';
import type {
  BenchmarkRow,
  CalculationRequest,
  DependencyNode,
  ExecutionRecord,
  PerformanceRow,
  CalculationRunResult,
} from '../data/repository';
import type { FeatureCalculationRepository } from '../data/repository';
import type {
  BenchmarkRowVm,
  CalculationGroupVm,
  CalculationResultVm,
  CalculationVm,
  DatasetVm,
  DependencyNodeVm,
  ExecutionRecordVm,
  FeatureCalculationSummaryVm,
  PerformanceRowVm,
  Tone,
} from '../domain/view-model';

function labelFor(key: string): string {
  return describeFeature(key as FeatureKey)?.label ?? key;
}

function categoryFor(key: string): string {
  return describeFeature(key as FeatureKey)?.category ?? 'STATISTICS';
}

function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

function ms(value: number): string {
  return `${value.toFixed(3)} ms`;
}

function count(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(0);
}

function paramSummary(params: Readonly<Record<string, number>>): string {
  const entries = Object.entries(params);
  return entries.length === 0 ? '—' : entries.map(([name, value]) => `${name}=${value}`).join(', ');
}

function checkTone(passed: boolean): Tone {
  return passed ? 'positive' : 'danger';
}

function toCalculationVm(key: string): CalculationVm {
  const descriptor = describeFeature(key as FeatureKey)!;
  return {
    key: descriptor.key,
    label: descriptor.label,
    category: descriptor.category,
    inputs: descriptor.inputs,
    params: descriptor.params.map((p) => ({
      name: p.name,
      label: p.label,
      defaultValue: p.defaultValue,
      min: p.min,
      max: p.max,
    })),
    outputs: descriptor.outputs,
    streaming: descriptor.streaming,
    description: descriptor.description,
  };
}

function toResultVm(result: CalculationRunResult): CalculationResultVm {
  return {
    featureKey: result.featureKey,
    label: labelFor(result.featureKey),
    datasetRef: result.datasetRef,
    paramSummary: paramSummary(result.params),
    length: result.length,
    warmup: result.warmup,
    finiteCount: result.finiteCount,
    finiteRatio: pct(result.finiteRatio),
    durationMs: ms(result.durationMs),
    manifestHash: result.manifestHash,
    validationPassed: result.validationPassed,
    checks: result.checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: {
        value: check.id,
        label: check.passed ? 'Pass' : 'Fail',
        tone: checkTone(check.passed),
      },
      detail: check.detail,
    })),
    outputKeys: result.outputKeys,
    preview: result.preview.map((point) => ({
      index: point.index,
      timeLabel: new Date(point.time).toISOString().slice(0, 10),
      value: point.value.toFixed(6),
    })),
    dependsOn: result.dependsOn.map(labelFor),
  };
}

function toExecutionVm(record: ExecutionRecord): ExecutionRecordVm {
  const failed = record.status === 'FAILED';
  return {
    id: record.id,
    featureLabel: labelFor(record.featureKey),
    featureKey: record.featureKey,
    datasetRef: record.datasetRef,
    status: {
      value: record.status,
      label: failed ? 'Failed' : 'Completed',
      tone: failed ? 'danger' : 'positive',
    },
    durationMs: ms(record.durationMs),
    finiteRatio: pct(record.finiteRatio),
    cached: record.cached,
    validationPassed: record.validationPassed,
    atLabel: record.at.slice(0, 19).replace('T', ' '),
  };
}

function toBenchmarkVm(row: BenchmarkRow): BenchmarkRowVm {
  return {
    featureKey: row.featureKey,
    label: labelFor(row.featureKey),
    category: categoryFor(row.featureKey),
    bars: row.bars,
    meanMs: ms(row.meanMs),
    opsPerSecond: count(row.opsPerSecond),
    barsPerSecond: count(row.barsPerSecond),
  };
}

function toPerformanceVm(row: PerformanceRow): PerformanceRowVm {
  return {
    featureKey: row.featureKey,
    label: labelFor(row.featureKey),
    runs: row.runs,
    cachedRuns: row.cachedRuns,
    meanDurationMs: ms(row.meanDurationMs),
    barsPerSecond: count(row.barsPerSecond),
  };
}

function toDependencyVm(node: DependencyNode): DependencyNodeVm {
  return {
    featureKey: node.featureKey,
    label: labelFor(node.featureKey),
    level: node.level,
    dependsOn: node.dependsOn.map(labelFor),
  };
}

export class FeatureCalculationAdminService {
  constructor(private readonly repository: FeatureCalculationRepository) {}

  async getSummary(): Promise<FeatureCalculationSummaryVm> {
    const [datasets, history] = await Promise.all([
      this.repository.listDatasets(),
      this.repository.getExecutionHistory(),
    ]);
    const categories = new Map<string, number>();
    for (const descriptor of FEATURE_CATALOG)
      categories.set(descriptor.category, (categories.get(descriptor.category) ?? 0) + 1);
    return {
      totalCalculations: FEATURE_CATALOG.length,
      categories: categories.size,
      streaming: FEATURE_CATALOG.filter((d) => d.streaming).length,
      datasets: datasets.length,
      executions: history.length,
      byCategory: [...categories.entries()].map(([category, count2]) => ({
        category,
        count: count2,
      })),
    };
  }

  async listCalculations(): Promise<CalculationGroupVm[]> {
    const byCategory = new Map<string, CalculationVm[]>();
    for (const descriptor of FEATURE_CATALOG) {
      const list = byCategory.get(descriptor.category) ?? [];
      list.push(toCalculationVm(descriptor.key));
      byCategory.set(descriptor.category, list);
    }
    return [...byCategory.entries()].map(([category, calculations]) => ({
      category,
      calculations,
    }));
  }

  async listDatasets(): Promise<DatasetVm[]> {
    return (await this.repository.listDatasets()).map((dataset) => ({
      ref: dataset.ref,
      label: dataset.label,
      bars: dataset.bars,
    }));
  }

  async runCalculation(request: CalculationRequest): Promise<CalculationResultVm> {
    return toResultVm(await this.repository.runCalculation(request));
  }

  async getExecutionHistory(): Promise<ExecutionRecordVm[]> {
    return (await this.repository.getExecutionHistory()).map(toExecutionVm);
  }

  async getExecutionStatus(limit = 10): Promise<ExecutionRecordVm[]> {
    return (await this.repository.getExecutionHistory()).slice(0, limit).map(toExecutionVm);
  }

  async runBenchmarkSuite(datasetRef: string): Promise<BenchmarkRowVm[]> {
    return (await this.repository.runBenchmarkSuite(datasetRef)).map(toBenchmarkVm);
  }

  async getPerformanceMetrics(): Promise<PerformanceRowVm[]> {
    return (await this.repository.getPerformanceMetrics()).map(toPerformanceVm);
  }

  async dependencyGraph(): Promise<DependencyNodeVm[]> {
    return (await this.repository.dependencyGraph()).map(toDependencyVm);
  }
}
