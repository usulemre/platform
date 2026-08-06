/**
 * Domain models for the Signal Calculation Engine. Pure data shapes — no IO, no persistence.
 */
import type { SignalKey, SignalValueKind } from '@platform/signal-calculation-sdk';

export type SignalParams = Readonly<Record<string, number>>;

/** A request to compute one signal over a dataset. */
export interface SignalRequest {
  readonly signalKey: SignalKey;
  readonly params?: SignalParams;
  readonly datasetRef: string;
}

/** The raw computed output of a signal (one or more named series; primary is the signal). */
export interface SignalOutput {
  readonly length: number;
  readonly primaryKey: string;
  readonly outputs: Readonly<Record<string, Float64Array>>;
}

/** A single validation check performed on a computed signal. */
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

/** The metadata generated for a computed signal (reproducibility + distribution record). */
export interface SignalResultMetadata {
  readonly signalKey: SignalKey;
  readonly params: SignalParams;
  readonly datasetRef: string;
  readonly valueKind: SignalValueKind;
  readonly length: number;
  readonly warmup: number;
  readonly finiteCount: number;
  readonly finiteRatio: number;
  readonly longCount: number;
  readonly shortCount: number;
  readonly flatCount: number;
  /** Non-flat finite values over finite values. */
  readonly activeRatio: number;
  readonly outputKeys: readonly string[];
  readonly inputHash: number;
  readonly outputHash: number;
  readonly manifestHash: string;
  readonly sdkVersion: string;
}

/** A fully computed, validated signal result. */
export interface SignalResult {
  readonly metadata: SignalResultMetadata;
  readonly validation: ValidationReport;
  readonly output: SignalOutput;
}

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

/** A record of one signal execution (for execution history / timeline / status). */
export interface ExecutionRecord {
  readonly id: string;
  readonly signalKey: SignalKey;
  readonly params: SignalParams;
  readonly datasetRef: string;
  readonly status: ExecutionStatus;
  readonly durationMs: number;
  readonly length: number;
  readonly warmup: number;
  readonly finiteRatio: number;
  readonly activeRatio: number;
  readonly cached: boolean;
  readonly validationPassed: boolean;
  readonly manifestHash?: string;
  readonly error?: string;
  readonly startedAt: string;
  readonly endedAt?: string;
}

/** The result of benchmarking one signal. */
export interface BenchmarkResult {
  readonly signalKey: SignalKey;
  readonly params: SignalParams;
  readonly bars: number;
  readonly iterations: number;
  readonly totalMs: number;
  readonly meanMs: number;
  readonly opsPerSecond: number;
  readonly barsPerSecond: number;
}

/** A node in the signal dependency graph. */
export interface DependencyNode {
  readonly signalKey: SignalKey;
  readonly dependsOn: readonly SignalKey[];
  readonly level: number;
}

/** The agreement statistics between two signals over a dataset (Signal Comparison). */
export interface SignalComparison {
  readonly signalA: SignalKey;
  readonly signalB: SignalKey;
  readonly datasetRef: string;
  /** Bars where both signals are finite. */
  readonly comparedBars: number;
  /** Fraction of compared bars where the two signals are equal. */
  readonly agreementRatio: number;
  /** Pearson correlation of the two direction series over compared bars. */
  readonly correlation: number;
  readonly bothLong: number;
  readonly bothShort: number;
  readonly opposite: number;
}
