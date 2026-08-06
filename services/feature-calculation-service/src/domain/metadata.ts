/**
 * The feature metadata generator — produces the reproducibility record for a computed feature:
 * warm-up length, finite ratio, input/output content hashes and a stable manifest hash (RP-1).
 * Pure and deterministic; no IO.
 */
import {
  finiteCount as sdkFiniteCount,
  warmupLength,
  type FeatureKey,
  type OhlcvSeries,
} from '@platform/feature-calculation-sdk';
import { hashFloat64, manifestHash } from './hashing';
import type { FeatureOutput, FeatureParams, FeatureResultMetadata } from './models';

const SDK_VERSION = '1.0.0';

/** A content hash of the input columns (order-stable) so distinct datasets differ. */
function inputHashFor(series: OhlcvSeries): number {
  let hash = hashFloat64(series.close);
  hash ^= hashFloat64(series.high);
  hash ^= hashFloat64(series.low);
  hash ^= hashFloat64(series.volume);
  return hash >>> 0;
}

export function generateMetadata(
  featureKey: FeatureKey,
  params: FeatureParams,
  datasetRef: string,
  series: OhlcvSeries,
  output: FeatureOutput,
): FeatureResultMetadata {
  const primary = output.outputs[output.primaryKey]!;
  const finite = sdkFiniteCount(primary);
  const inputHash = inputHashFor(series);
  const outputHash = hashFloat64(primary);
  return {
    featureKey,
    params,
    datasetRef,
    length: output.length,
    warmup: warmupLength(primary),
    finiteCount: finite,
    finiteRatio: output.length > 0 ? finite / output.length : 0,
    outputKeys: Object.keys(output.outputs),
    inputHash,
    outputHash,
    manifestHash: manifestHash(featureKey, params, inputHash, outputHash),
    sdkVersion: SDK_VERSION,
  };
}
