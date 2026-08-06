/**
 * Domain models for the Portfolio Optimization Engine. Pure data shapes — no IO, no persistence.
 * Reuses the SDK's numeric result/metrics/constraint types.
 */
import type {
  ConstraintConfig,
  OptimizerKey,
  PortfolioMetrics,
} from '@platform/portfolio-optimization-sdk';

export type OptimizerParams = Readonly<Record<string, number>>;

/** A request to optimize a portfolio over a universe with a given method and constraints. */
export interface OptimizationRequest {
  readonly optimizerKey: OptimizerKey;
  readonly params?: OptimizerParams;
  readonly universeRef: string;
  readonly constraints?: Partial<ConstraintConfig>;
}

/** An allocation: one asset and its weight. */
export interface Allocation {
  readonly asset: string;
  readonly weight: number;
  /** Fraction of portfolio variance contributed by this asset. */
  readonly riskContribution: number;
  readonly sector?: string;
}

/** A single validation check performed on an optimization result. */
export interface ValidationCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface ValidationReport {
  readonly passed: boolean;
  readonly checks: readonly ValidationCheck[];
}

/** The reproducibility metadata generated for an optimization result. */
export interface OptimizationResultMetadata {
  readonly optimizerKey: OptimizerKey;
  readonly params: OptimizerParams;
  readonly universeRef: string;
  readonly assetCount: number;
  readonly iterations: number;
  readonly converged: boolean;
  readonly inputHash: number;
  readonly outputHash: number;
  readonly manifestHash: string;
  readonly sdkVersion: string;
}

/** A fully computed, validated optimization result. */
export interface OptimizationResultRecord {
  readonly metadata: OptimizationResultMetadata;
  readonly validation: ValidationReport;
  readonly allocations: readonly Allocation[];
  readonly cashWeight: number;
  readonly metrics: PortfolioMetrics;
  readonly constraints: ConstraintConfig;
}

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

/** A record of one optimization execution (for optimization history / status). */
export interface ExecutionRecord {
  readonly id: string;
  readonly optimizerKey: OptimizerKey;
  readonly params: OptimizerParams;
  readonly universeRef: string;
  readonly status: ExecutionStatus;
  readonly durationMs: number;
  readonly assetCount: number;
  readonly expectedReturn: number;
  readonly volatility: number;
  readonly sharpe: number;
  readonly iterations: number;
  readonly converged: boolean;
  readonly cached: boolean;
  readonly validationPassed: boolean;
  readonly manifestHash?: string;
  readonly error?: string;
  readonly startedAt: string;
  readonly endedAt?: string;
}

/** The result of benchmarking one optimizer. */
export interface BenchmarkResult {
  readonly optimizerKey: OptimizerKey;
  readonly params: OptimizerParams;
  readonly assets: number;
  readonly iterations: number;
  readonly totalMs: number;
  readonly meanMs: number;
  readonly opsPerSecond: number;
}

/** A node in the optimizer dependency graph. */
export interface DependencyNode {
  readonly optimizerKey: OptimizerKey;
  readonly dependsOn: readonly OptimizerKey[];
  readonly level: number;
}

/** A row in an optimizer comparison — metrics per method over the same universe. */
export interface ComparisonRow {
  readonly optimizerKey: OptimizerKey;
  readonly expectedReturn: number;
  readonly volatility: number;
  readonly sharpe: number;
  readonly diversificationRatio: number;
  readonly effectiveAssets: number;
  readonly maxWeight: number;
  readonly turnover: number;
  readonly validationPassed: boolean;
}
