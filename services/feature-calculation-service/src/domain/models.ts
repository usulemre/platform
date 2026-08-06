/**
 * Domain models for the Feature Calculation Engine. Pure data shapes — no IO, no persistence.
 */
import type { FeatureKey } from '@platform/feature-calculation-sdk';

export type FeatureParams = Readonly<Record<string, number>>;

/** A request to compute one feature over a dataset. */
export interface FeatureRequest {
  readonly featureKey: FeatureKey;
  readonly params?: FeatureParams;
  readonly datasetRef: string;
}

/** The raw computed output of a feature (one or more named series). */
export interface FeatureOutput {
  readonly length: number;
  readonly primaryKey: string;
  readonly outputs: Readonly<Record<string, Float64Array>>;
}

/** A single validation check performed on a computed result. */
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

/** The metadata generated for a computed feature (reproducibility record). */
export interface FeatureResultMetadata {
  readonly featureKey: FeatureKey;
  readonly params: FeatureParams;
  readonly datasetRef: string;
  readonly length: number;
  readonly warmup: number;
  readonly finiteCount: number;
  readonly finiteRatio: number;
  readonly outputKeys: readonly string[];
  readonly inputHash: number;
  readonly outputHash: number;
  readonly manifestHash: string;
  readonly sdkVersion: string;
}

/** A fully computed, validated feature result. */
export interface FeatureResult {
  readonly metadata: FeatureResultMetadata;
  readonly validation: ValidationReport;
  readonly output: FeatureOutput;
}

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

/** A record of one feature execution (for execution history / status). */
export interface ExecutionRecord {
  readonly id: string;
  readonly featureKey: FeatureKey;
  readonly params: FeatureParams;
  readonly datasetRef: string;
  readonly status: ExecutionStatus;
  readonly durationMs: number;
  readonly length: number;
  readonly warmup: number;
  readonly finiteRatio: number;
  readonly cached: boolean;
  readonly validationPassed: boolean;
  readonly manifestHash?: string;
  readonly error?: string;
  readonly startedAt: string;
  readonly endedAt?: string;
}

/** The result of benchmarking one feature. */
export interface BenchmarkResult {
  readonly featureKey: FeatureKey;
  readonly params: FeatureParams;
  readonly bars: number;
  readonly iterations: number;
  readonly totalMs: number;
  readonly meanMs: number;
  readonly opsPerSecond: number;
  readonly barsPerSecond: number;
}

/** A node in the feature dependency graph. */
export interface DependencyNode {
  readonly featureKey: FeatureKey;
  readonly dependsOn: readonly FeatureKey[];
  readonly level: number;
}
