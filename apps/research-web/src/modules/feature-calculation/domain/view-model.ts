/**
 * Feature Calculation view models — UI-facing, pre-formatted shapes produced by the application
 * service so components carry no logic. Inert display data (the real computation happens in the
 * SDK / data layer).
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface CalculationParamVm {
  readonly name: string;
  readonly label: string;
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
}

export interface CalculationVm {
  readonly key: string;
  readonly label: string;
  readonly category: string;
  readonly inputs: readonly string[];
  readonly params: readonly CalculationParamVm[];
  readonly outputs: readonly string[];
  readonly streaming: boolean;
  readonly description: string;
}

export interface CalculationGroupVm {
  readonly category: string;
  readonly calculations: readonly CalculationVm[];
}

export interface DatasetVm {
  readonly ref: string;
  readonly label: string;
  readonly bars: number;
}

export interface PreviewPointVm {
  readonly index: number;
  readonly timeLabel: string;
  readonly value: string;
}

export interface CheckVm {
  readonly id: string;
  readonly label: string;
  readonly status: StatusVm;
  readonly detail: string;
}

export interface CalculationResultVm {
  readonly featureKey: string;
  readonly label: string;
  readonly datasetRef: string;
  readonly paramSummary: string;
  readonly length: number;
  readonly warmup: number;
  readonly finiteCount: number;
  readonly finiteRatio: string;
  readonly durationMs: string;
  readonly manifestHash: string;
  readonly validationPassed: boolean;
  readonly checks: readonly CheckVm[];
  readonly outputKeys: readonly string[];
  readonly preview: readonly PreviewPointVm[];
  readonly dependsOn: readonly string[];
}

export interface ExecutionRecordVm {
  readonly id: string;
  readonly featureLabel: string;
  readonly featureKey: string;
  readonly datasetRef: string;
  readonly status: StatusVm;
  readonly durationMs: string;
  readonly finiteRatio: string;
  readonly cached: boolean;
  readonly validationPassed: boolean;
  readonly atLabel: string;
}

export interface BenchmarkRowVm {
  readonly featureKey: string;
  readonly label: string;
  readonly category: string;
  readonly bars: number;
  readonly meanMs: string;
  readonly opsPerSecond: string;
  readonly barsPerSecond: string;
}

export interface PerformanceRowVm {
  readonly featureKey: string;
  readonly label: string;
  readonly runs: number;
  readonly cachedRuns: number;
  readonly meanDurationMs: string;
  readonly barsPerSecond: string;
}

export interface DependencyNodeVm {
  readonly featureKey: string;
  readonly label: string;
  readonly level: number;
  readonly dependsOn: readonly string[];
}

export interface FeatureCalculationSummaryVm {
  readonly totalCalculations: number;
  readonly categories: number;
  readonly streaming: number;
  readonly datasets: number;
  readonly executions: number;
  readonly byCategory: readonly { readonly category: string; readonly count: number }[];
}
