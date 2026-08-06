/**
 * Feature Calculation repository boundary — the ONLY data abstraction the application service
 * depends on. The concrete adapter runs the REAL SDK calculations over synthetic datasets; the UI
 * never sees a concrete data source and never touches the service tier or persistence.
 */
import type { FeatureDescriptor, FeatureKey } from '@platform/feature-calculation-sdk';

export interface CalculationRequest {
  readonly featureKey: FeatureKey;
  readonly params?: Readonly<Record<string, number>>;
  readonly datasetRef: string;
}

export interface RunCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface CalculationRunResult {
  readonly featureKey: FeatureKey;
  readonly params: Readonly<Record<string, number>>;
  readonly datasetRef: string;
  readonly length: number;
  readonly warmup: number;
  readonly finiteCount: number;
  readonly finiteRatio: number;
  readonly durationMs: number;
  readonly manifestHash: string;
  readonly validationPassed: boolean;
  readonly checks: readonly RunCheck[];
  readonly outputKeys: readonly string[];
  readonly preview: readonly {
    readonly index: number;
    readonly time: number;
    readonly value: number;
  }[];
  readonly dependsOn: readonly FeatureKey[];
}

export interface ExecutionRecord {
  readonly id: string;
  readonly featureKey: FeatureKey;
  readonly datasetRef: string;
  readonly status: 'COMPLETED' | 'FAILED';
  readonly durationMs: number;
  readonly finiteRatio: number;
  readonly cached: boolean;
  readonly validationPassed: boolean;
  readonly at: string;
  readonly error?: string;
}

export interface BenchmarkRow {
  readonly featureKey: FeatureKey;
  readonly bars: number;
  readonly meanMs: number;
  readonly opsPerSecond: number;
  readonly barsPerSecond: number;
}

export interface PerformanceRow {
  readonly featureKey: FeatureKey;
  readonly runs: number;
  readonly cachedRuns: number;
  readonly meanDurationMs: number;
  readonly barsPerSecond: number;
}

export interface DependencyNode {
  readonly featureKey: FeatureKey;
  readonly level: number;
  readonly dependsOn: readonly FeatureKey[];
}

export interface FeatureCalculationRepository {
  listCalculations(): Promise<readonly FeatureDescriptor[]>;
  listDatasets(): Promise<
    readonly { readonly ref: string; readonly label: string; readonly bars: number }[]
  >;
  runCalculation(request: CalculationRequest): Promise<CalculationRunResult>;
  getExecutionHistory(): Promise<readonly ExecutionRecord[]>;
  runBenchmarkSuite(datasetRef: string): Promise<readonly BenchmarkRow[]>;
  getPerformanceMetrics(): Promise<readonly PerformanceRow[]>;
  dependencyGraph(): Promise<readonly DependencyNode[]>;
}
