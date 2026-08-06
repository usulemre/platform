/**
 * Signal Calculation repository boundary — the ONLY data abstraction the application service depends
 * on. The concrete adapter runs the REAL SDK generators over synthetic datasets; the UI never sees a
 * concrete data source and never touches the service tier or persistence.
 */
import type { FeatureKey, SignalDescriptor, SignalKey } from '@platform/signal-calculation-sdk';

export interface SignalRunRequest {
  readonly signalKey: SignalKey;
  readonly params?: Readonly<Record<string, number>>;
  readonly datasetRef: string;
}

export interface RunCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface PreviewPoint {
  readonly index: number;
  readonly time: number;
  readonly value: number;
}

export interface SignalRunResult {
  readonly signalKey: SignalKey;
  readonly params: Readonly<Record<string, number>>;
  readonly datasetRef: string;
  readonly valueKind: string;
  readonly length: number;
  readonly warmup: number;
  readonly finiteCount: number;
  readonly finiteRatio: number;
  readonly long: number;
  readonly short: number;
  readonly flat: number;
  readonly activeRatio: number;
  readonly durationMs: number;
  readonly manifestHash: string;
  readonly validationPassed: boolean;
  readonly checks: readonly RunCheck[];
  readonly outputKeys: readonly string[];
  readonly preview: readonly PreviewPoint[];
  readonly dependsOn: readonly SignalKey[];
  readonly features: readonly FeatureKey[];
}

export interface ExecutionRecord {
  readonly id: string;
  readonly signalKey: SignalKey;
  readonly datasetRef: string;
  readonly status: 'COMPLETED' | 'FAILED';
  readonly durationMs: number;
  readonly activeRatio: number;
  readonly cached: boolean;
  readonly validationPassed: boolean;
  readonly at: string;
  readonly error?: string;
}

export interface BenchmarkRow {
  readonly signalKey: SignalKey;
  readonly bars: number;
  readonly meanMs: number;
  readonly opsPerSecond: number;
  readonly barsPerSecond: number;
}

export interface PerformanceRow {
  readonly signalKey: SignalKey;
  readonly runs: number;
  readonly cachedRuns: number;
  readonly meanDurationMs: number;
  readonly barsPerSecond: number;
}

export interface DependencyNode {
  readonly signalKey: SignalKey;
  readonly level: number;
  readonly dependsOn: readonly SignalKey[];
  readonly features: readonly FeatureKey[];
}

export interface ComparisonResult {
  readonly signalA: SignalKey;
  readonly signalB: SignalKey;
  readonly datasetRef: string;
  readonly comparedBars: number;
  readonly agreementRatio: number;
  readonly correlation: number;
  readonly bothLong: number;
  readonly bothShort: number;
  readonly opposite: number;
}

export interface DebugRow {
  readonly index: number;
  readonly time: number;
  readonly components: readonly { readonly name: string; readonly value: number }[];
  readonly signal: number;
}

export interface DebugResult {
  readonly signalKey: SignalKey;
  readonly datasetRef: string;
  readonly componentNames: readonly string[];
  readonly rows: readonly DebugRow[];
}

export interface SignalCalculationRepository {
  listSignals(): Promise<readonly SignalDescriptor[]>;
  listDatasets(): Promise<
    readonly { readonly ref: string; readonly label: string; readonly bars: number }[]
  >;
  runSignal(request: SignalRunRequest): Promise<SignalRunResult>;
  debugSignal(request: SignalRunRequest, rows?: number): Promise<DebugResult>;
  compareSignals(
    datasetRef: string,
    signalA: SignalKey,
    signalB: SignalKey,
  ): Promise<ComparisonResult>;
  getExecutionHistory(): Promise<readonly ExecutionRecord[]>;
  runBenchmarkSuite(datasetRef: string): Promise<readonly BenchmarkRow[]>;
  getPerformanceMetrics(): Promise<readonly PerformanceRow[]>;
  dependencyGraph(): Promise<readonly DependencyNode[]>;
}
