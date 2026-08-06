/**
 * Signal Calculation view models — UI-facing, pre-formatted shapes produced by the application
 * service so components carry no logic. The real computation happens in the SDK / data layer.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface SignalParamVm {
  readonly name: string;
  readonly label: string;
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
  readonly integer: boolean;
}

export interface SignalVm {
  readonly key: string;
  readonly label: string;
  readonly category: string;
  readonly inputs: readonly string[];
  readonly params: readonly SignalParamVm[];
  readonly outputs: readonly string[];
  readonly valueKind: string;
  readonly streaming: boolean;
  readonly features: readonly string[];
  readonly description: string;
}

export interface SignalGroupVm {
  readonly category: string;
  readonly signals: readonly SignalVm[];
}

export interface DatasetVm {
  readonly ref: string;
  readonly label: string;
  readonly bars: number;
}

export interface PreviewPointVm {
  readonly index: number;
  readonly timeLabel: string;
  readonly valueLabel: string;
  readonly tone: Tone;
}

export interface CheckVm {
  readonly id: string;
  readonly label: string;
  readonly status: StatusVm;
  readonly detail: string;
}

export interface SignalResultVm {
  readonly signalKey: string;
  readonly label: string;
  readonly valueKind: string;
  readonly datasetRef: string;
  readonly paramSummary: string;
  readonly length: number;
  readonly warmup: number;
  readonly finiteCount: number;
  readonly finiteRatio: string;
  readonly long: number;
  readonly short: number;
  readonly flat: number;
  readonly activeRatio: string;
  readonly durationMs: string;
  readonly manifestHash: string;
  readonly validationPassed: boolean;
  readonly checks: readonly CheckVm[];
  readonly outputKeys: readonly string[];
  readonly preview: readonly PreviewPointVm[];
  readonly dependsOn: readonly string[];
  readonly features: readonly string[];
}

export interface ExecutionRecordVm {
  readonly id: string;
  readonly signalLabel: string;
  readonly signalKey: string;
  readonly datasetRef: string;
  readonly status: StatusVm;
  readonly durationMs: string;
  readonly activeRatio: string;
  readonly cached: boolean;
  readonly validationPassed: boolean;
  readonly atLabel: string;
}

export interface BenchmarkRowVm {
  readonly signalKey: string;
  readonly label: string;
  readonly category: string;
  readonly bars: number;
  readonly meanMs: string;
  readonly opsPerSecond: string;
  readonly barsPerSecond: string;
}

export interface PerformanceRowVm {
  readonly signalKey: string;
  readonly label: string;
  readonly runs: number;
  readonly cachedRuns: number;
  readonly meanDurationMs: string;
  readonly barsPerSecond: string;
}

export interface DependencyNodeVm {
  readonly signalKey: string;
  readonly label: string;
  readonly level: number;
  readonly dependsOn: readonly string[];
  readonly features: readonly string[];
}

export interface ComparisonVm {
  readonly signalALabel: string;
  readonly signalBLabel: string;
  readonly datasetRef: string;
  readonly comparedBars: number;
  readonly agreementRatio: string;
  readonly correlation: string;
  readonly bothLong: number;
  readonly bothShort: number;
  readonly opposite: number;
}

export interface DebugComponentVm {
  readonly name: string;
  readonly value: string;
}

export interface DebugRowVm {
  readonly index: number;
  readonly timeLabel: string;
  readonly components: readonly DebugComponentVm[];
  readonly signal: StatusVm;
}

export interface DebugResultVm {
  readonly signalLabel: string;
  readonly datasetRef: string;
  readonly componentNames: readonly string[];
  readonly rows: readonly DebugRowVm[];
}

export interface SignalCalculationSummaryVm {
  readonly totalSignals: number;
  readonly categories: number;
  readonly streaming: number;
  readonly datasets: number;
  readonly executions: number;
  readonly byCategory: readonly { readonly category: string; readonly count: number }[];
}
