/**
 * Portfolio Optimization view models — UI-facing, pre-formatted shapes produced by the application
 * service so components carry no logic. The real optimization happens in the SDK / data layer.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface OptimizerParamVm {
  readonly name: string;
  readonly label: string;
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
  readonly integer: boolean;
}

export interface OptimizerVm {
  readonly key: string;
  readonly label: string;
  readonly category: string;
  readonly params: readonly OptimizerParamVm[];
  readonly usesSignals: boolean;
  readonly usesPrevious: boolean;
  readonly iterative: boolean;
  readonly description: string;
}

export interface OptimizerGroupVm {
  readonly category: string;
  readonly optimizers: readonly OptimizerVm[];
}

export interface UniverseVm {
  readonly ref: string;
  readonly label: string;
  readonly assets: number;
  readonly periods: number;
}

export interface AllocationVm {
  readonly asset: string;
  readonly weightPct: string;
  readonly weightRaw: number;
  readonly riskContributionPct: string;
  readonly sector: string;
}

export interface MetricsVm {
  readonly expectedReturn: string;
  readonly volatility: string;
  readonly sharpe: string;
  readonly diversificationRatio: string;
  readonly effectiveAssets: string;
  readonly maxWeight: string;
  readonly grossLeverage: string;
  readonly netExposure: string;
  readonly turnover: string;
}

export interface CheckVm {
  readonly id: string;
  readonly label: string;
  readonly status: StatusVm;
  readonly detail: string;
}

export interface OptimizationResultVm {
  readonly optimizerKey: string;
  readonly label: string;
  readonly universeRef: string;
  readonly paramSummary: string;
  readonly allocations: readonly AllocationVm[];
  readonly cashWeightPct: string;
  readonly metrics: MetricsVm;
  readonly iterations: number;
  readonly converged: boolean;
  readonly durationMs: string;
  readonly manifestHash: string;
  readonly validationPassed: boolean;
  readonly checks: readonly CheckVm[];
  readonly constraintChecks: readonly CheckVm[];
}

export interface ExecutionRecordVm {
  readonly id: string;
  readonly optimizerLabel: string;
  readonly optimizerKey: string;
  readonly universeRef: string;
  readonly status: StatusVm;
  readonly durationMs: string;
  readonly volatility: string;
  readonly sharpe: string;
  readonly iterations: number;
  readonly converged: boolean;
  readonly cached: boolean;
  readonly validationPassed: boolean;
  readonly atLabel: string;
}

export interface FrontierPointVm {
  readonly riskAversion: string;
  readonly volatility: number;
  readonly expectedReturn: number;
  readonly volatilityLabel: string;
  readonly expectedReturnLabel: string;
  readonly sharpe: string;
  readonly isMaxSharpe: boolean;
}

export interface ComparisonRowVm {
  readonly optimizerKey: string;
  readonly label: string;
  readonly category: string;
  readonly expectedReturn: string;
  readonly volatility: string;
  readonly sharpe: string;
  readonly diversificationRatio: string;
  readonly effectiveAssets: string;
  readonly maxWeight: string;
  readonly turnover: string;
  readonly validationPassed: boolean;
}

export interface BenchmarkRowVm {
  readonly optimizerKey: string;
  readonly label: string;
  readonly category: string;
  readonly assets: number;
  readonly meanMs: string;
  readonly opsPerSecond: string;
}

export interface PerformanceRowVm {
  readonly optimizerKey: string;
  readonly label: string;
  readonly runs: number;
  readonly meanDurationMs: string;
  readonly meanIterations: string;
}

export interface DependencyNodeVm {
  readonly optimizerKey: string;
  readonly label: string;
  readonly level: number;
  readonly dependsOn: readonly string[];
}

export interface PortfolioOptimizationSummaryVm {
  readonly totalOptimizers: number;
  readonly categories: number;
  readonly universes: number;
  readonly executions: number;
  readonly byCategory: readonly { readonly category: string; readonly count: number }[];
}
