/**
 * Portfolio Optimization repository boundary — the ONLY data abstraction the application service
 * depends on. The concrete adapter runs the REAL SDK optimizers over synthetic universes; the UI
 * never sees a concrete data source and never touches the service tier or persistence.
 */
import type { OptimizerDescriptor, OptimizerKey } from '@platform/portfolio-optimization-sdk';
import type { ConstraintDto } from './runner';

export interface OptimizeRequest {
  readonly optimizerKey: OptimizerKey;
  readonly universeRef: string;
  readonly params?: Readonly<Record<string, number>>;
  readonly constraints: ConstraintDto;
}

export interface RunCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface AllocationDto {
  readonly asset: string;
  readonly weight: number;
  readonly riskContribution: number;
  readonly sector?: string;
}

export interface OptimizationMetricsDto {
  readonly expectedReturn: number;
  readonly volatility: number;
  readonly sharpe: number;
  readonly diversificationRatio: number;
  readonly effectiveAssets: number;
  readonly concentration: number;
  readonly maxWeight: number;
  readonly grossLeverage: number;
  readonly netExposure: number;
  readonly turnover: number;
}

export interface OptimizationResultDto {
  readonly optimizerKey: OptimizerKey;
  readonly universeRef: string;
  readonly params: Readonly<Record<string, number>>;
  readonly assets: readonly string[];
  readonly allocations: readonly AllocationDto[];
  readonly cashWeight: number;
  readonly metrics: OptimizationMetricsDto;
  readonly iterations: number;
  readonly converged: boolean;
  readonly durationMs: number;
  readonly manifestHash: string;
  readonly validationPassed: boolean;
  readonly checks: readonly RunCheck[];
  readonly constraintChecks: readonly RunCheck[];
}

export interface ExecutionRecord {
  readonly id: string;
  readonly optimizerKey: OptimizerKey;
  readonly universeRef: string;
  readonly status: 'COMPLETED' | 'FAILED';
  readonly durationMs: number;
  readonly volatility: number;
  readonly sharpe: number;
  readonly iterations: number;
  readonly converged: boolean;
  readonly cached: boolean;
  readonly validationPassed: boolean;
  readonly at: string;
  readonly error?: string;
}

export interface FrontierPointDto {
  readonly riskAversion: number;
  readonly volatility: number;
  readonly expectedReturn: number;
  readonly sharpe: number;
  readonly isMaxSharpe: boolean;
}

export interface ComparisonRowDto {
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

export interface BenchmarkRow {
  readonly optimizerKey: OptimizerKey;
  readonly assets: number;
  readonly meanMs: number;
  readonly opsPerSecond: number;
}

export interface PerformanceRow {
  readonly optimizerKey: OptimizerKey;
  readonly runs: number;
  readonly meanDurationMs: number;
  readonly meanIterations: number;
}

export interface DependencyNode {
  readonly optimizerKey: OptimizerKey;
  readonly level: number;
  readonly dependsOn: readonly OptimizerKey[];
}

export interface PortfolioOptimizationRepository {
  listOptimizers(): Promise<readonly OptimizerDescriptor[]>;
  listUniverses(): Promise<
    readonly {
      readonly ref: string;
      readonly label: string;
      readonly assets: number;
      readonly periods: number;
    }[]
  >;
  optimize(request: OptimizeRequest): Promise<OptimizationResultDto>;
  efficientFrontier(
    universeRef: string,
    constraints: ConstraintDto,
    points?: number,
  ): Promise<readonly FrontierPointDto[]>;
  compareOptimizers(
    universeRef: string,
    keys: readonly OptimizerKey[],
    constraints: ConstraintDto,
  ): Promise<readonly ComparisonRowDto[]>;
  getExecutionHistory(): Promise<readonly ExecutionRecord[]>;
  runBenchmarkSuite(universeRef: string): Promise<readonly BenchmarkRow[]>;
  getPerformanceMetrics(): Promise<readonly PerformanceRow[]>;
  dependencyGraph(): Promise<readonly DependencyNode[]>;
}
