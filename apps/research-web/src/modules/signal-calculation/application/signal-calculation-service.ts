/**
 * Signal Calculation application service — the ONLY layer the UI/hooks call. Orchestrates the
 * repository (which runs the REAL SDK generators) and maps results to view models. No generation
 * logic and no business logic here — presentation mapping only.
 */
import { SIGNAL_CATALOG, describeSignal, type SignalKey } from '@platform/signal-calculation-sdk';
import type {
  BenchmarkRow,
  ComparisonResult,
  DebugResult,
  DependencyNode,
  ExecutionRecord,
  PerformanceRow,
  SignalRunRequest,
  SignalRunResult,
  SignalCalculationRepository,
} from '../data/repository';
import type {
  BenchmarkRowVm,
  ComparisonVm,
  DatasetVm,
  DebugResultVm,
  DependencyNodeVm,
  ExecutionRecordVm,
  PerformanceRowVm,
  SignalCalculationSummaryVm,
  SignalGroupVm,
  SignalResultVm,
  SignalVm,
  StatusVm,
  Tone,
} from '../domain/view-model';

function labelFor(key: string): string {
  return describeSignal(key as SignalKey)?.label ?? key;
}

function categoryFor(key: string): string {
  return describeSignal(key as SignalKey)?.category ?? 'CROSSOVER';
}

function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

function ms(value: number): string {
  return `${value.toFixed(3)} ms`;
}

function ratioText(value: number): string {
  return value.toFixed(3);
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

function dateLabel(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

/** Map a signal value + kind to a labelled, toned status. */
function signalStatus(value: number, valueKind: string): StatusVm {
  if (!Number.isFinite(value)) return { value: 'nan', label: '—', tone: 'neutral' };
  if (valueKind === 'unit')
    return { value: value.toFixed(3), label: value.toFixed(3), tone: 'info' };
  if (valueKind === 'gate')
    return value === 1
      ? { value: '1', label: 'On', tone: 'positive' }
      : { value: '0', label: 'Off', tone: 'neutral' };
  if (value > 0) return { value: '1', label: 'Long', tone: 'positive' };
  if (value < 0) return { value: '-1', label: 'Short', tone: 'danger' };
  return { value: '0', label: 'Flat', tone: 'neutral' };
}

function checkTone(passed: boolean): Tone {
  return passed ? 'positive' : 'danger';
}

function toSignalVm(key: string): SignalVm {
  const descriptor = describeSignal(key as SignalKey)!;
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
      integer: p.integer,
    })),
    outputs: descriptor.outputs,
    valueKind: descriptor.valueKind,
    streaming: descriptor.streaming,
    features: descriptor.features,
    description: descriptor.description,
  };
}

function toResultVm(result: SignalRunResult): SignalResultVm {
  return {
    signalKey: result.signalKey,
    label: labelFor(result.signalKey),
    valueKind: result.valueKind,
    datasetRef: result.datasetRef,
    paramSummary: paramSummary(result.params),
    length: result.length,
    warmup: result.warmup,
    finiteCount: result.finiteCount,
    finiteRatio: pct(result.finiteRatio),
    long: result.long,
    short: result.short,
    flat: result.flat,
    activeRatio: pct(result.activeRatio),
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
    preview: result.preview.map((point) => {
      const status = signalStatus(point.value, result.valueKind);
      return {
        index: point.index,
        timeLabel: dateLabel(point.time),
        valueLabel: status.label,
        tone: status.tone,
      };
    }),
    dependsOn: result.dependsOn.map(labelFor),
    features: result.features,
  };
}

function toExecutionVm(record: ExecutionRecord): ExecutionRecordVm {
  const failed = record.status === 'FAILED';
  return {
    id: record.id,
    signalLabel: labelFor(record.signalKey),
    signalKey: record.signalKey,
    datasetRef: record.datasetRef,
    status: {
      value: record.status,
      label: failed ? 'Failed' : 'Completed',
      tone: failed ? 'danger' : 'positive',
    },
    durationMs: ms(record.durationMs),
    activeRatio: pct(record.activeRatio),
    cached: record.cached,
    validationPassed: record.validationPassed,
    atLabel: record.at.slice(0, 19).replace('T', ' '),
  };
}

function toBenchmarkVm(row: BenchmarkRow): BenchmarkRowVm {
  return {
    signalKey: row.signalKey,
    label: labelFor(row.signalKey),
    category: categoryFor(row.signalKey),
    bars: row.bars,
    meanMs: ms(row.meanMs),
    opsPerSecond: count(row.opsPerSecond),
    barsPerSecond: count(row.barsPerSecond),
  };
}

function toPerformanceVm(row: PerformanceRow): PerformanceRowVm {
  return {
    signalKey: row.signalKey,
    label: labelFor(row.signalKey),
    runs: row.runs,
    cachedRuns: row.cachedRuns,
    meanDurationMs: ms(row.meanDurationMs),
    barsPerSecond: count(row.barsPerSecond),
  };
}

function toDependencyVm(node: DependencyNode): DependencyNodeVm {
  return {
    signalKey: node.signalKey,
    label: labelFor(node.signalKey),
    level: node.level,
    dependsOn: node.dependsOn.map(labelFor),
    features: node.features,
  };
}

function toComparisonVm(result: ComparisonResult): ComparisonVm {
  return {
    signalALabel: labelFor(result.signalA),
    signalBLabel: labelFor(result.signalB),
    datasetRef: result.datasetRef,
    comparedBars: result.comparedBars,
    agreementRatio: pct(result.agreementRatio),
    correlation: ratioText(result.correlation),
    bothLong: result.bothLong,
    bothShort: result.bothShort,
    opposite: result.opposite,
  };
}

function toDebugVm(result: DebugResult): DebugResultVm {
  const valueKind = describeSignal(result.signalKey)?.valueKind ?? 'direction';
  return {
    signalLabel: labelFor(result.signalKey),
    datasetRef: result.datasetRef,
    componentNames: result.componentNames,
    rows: result.rows.map((row) => ({
      index: row.index,
      timeLabel: dateLabel(row.time),
      components: row.components.map((component) => ({
        name: component.name,
        value: Number.isFinite(component.value) ? component.value.toFixed(4) : '—',
      })),
      signal: signalStatus(row.signal, valueKind),
    })),
  };
}

export class SignalCalculationAdminService {
  constructor(private readonly repository: SignalCalculationRepository) {}

  async getSummary(): Promise<SignalCalculationSummaryVm> {
    const [datasets, history] = await Promise.all([
      this.repository.listDatasets(),
      this.repository.getExecutionHistory(),
    ]);
    const categories = new Map<string, number>();
    for (const descriptor of SIGNAL_CATALOG)
      categories.set(descriptor.category, (categories.get(descriptor.category) ?? 0) + 1);
    return {
      totalSignals: SIGNAL_CATALOG.length,
      categories: categories.size,
      streaming: SIGNAL_CATALOG.filter((d) => d.streaming).length,
      datasets: datasets.length,
      executions: history.length,
      byCategory: [...categories.entries()].map(([category, count2]) => ({
        category,
        count: count2,
      })),
    };
  }

  async listSignals(): Promise<SignalGroupVm[]> {
    const byCategory = new Map<string, SignalVm[]>();
    for (const descriptor of SIGNAL_CATALOG) {
      const list = byCategory.get(descriptor.category) ?? [];
      list.push(toSignalVm(descriptor.key));
      byCategory.set(descriptor.category, list);
    }
    return [...byCategory.entries()].map(([category, signals]) => ({ category, signals }));
  }

  async listDatasets(): Promise<DatasetVm[]> {
    return (await this.repository.listDatasets()).map((dataset) => ({
      ref: dataset.ref,
      label: dataset.label,
      bars: dataset.bars,
    }));
  }

  async runSignal(request: SignalRunRequest): Promise<SignalResultVm> {
    return toResultVm(await this.repository.runSignal(request));
  }

  async debugSignal(request: SignalRunRequest): Promise<DebugResultVm> {
    return toDebugVm(await this.repository.debugSignal(request));
  }

  async compareSignals(
    datasetRef: string,
    signalA: SignalKey,
    signalB: SignalKey,
  ): Promise<ComparisonVm> {
    return toComparisonVm(await this.repository.compareSignals(datasetRef, signalA, signalB));
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
