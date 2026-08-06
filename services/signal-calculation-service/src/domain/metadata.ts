/**
 * The signal metadata generator — produces the reproducibility + distribution record for a computed
 * signal: warm-up length, finite ratio, long/short/flat distribution, active ratio, input/output
 * content hashes and a stable manifest hash (RP-1). Pure and deterministic; no IO.
 */
import {
  describeSignal,
  finiteCount as sdkFiniteCount,
  signalDistribution,
  warmupLength,
  type OhlcvSeries,
  type SignalKey,
} from '@platform/signal-calculation-sdk';
import { hashFloat64, manifestHash } from './hashing';
import type { SignalOutput, SignalParams, SignalResultMetadata } from './models';

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
  signalKey: SignalKey,
  params: SignalParams,
  datasetRef: string,
  series: OhlcvSeries,
  output: SignalOutput,
): SignalResultMetadata {
  const primary = output.outputs[output.primaryKey]!;
  const finite = sdkFiniteCount(primary);
  const distribution = signalDistribution(primary);
  const inputHash = inputHashFor(series);
  const outputHash = hashFloat64(primary);
  return {
    signalKey,
    params,
    datasetRef,
    valueKind: describeSignal(signalKey)?.valueKind ?? 'direction',
    length: output.length,
    warmup: warmupLength(primary),
    finiteCount: finite,
    finiteRatio: output.length > 0 ? finite / output.length : 0,
    longCount: distribution.long,
    shortCount: distribution.short,
    flatCount: distribution.flat,
    activeRatio: distribution.finite > 0 ? distribution.active / distribution.finite : 0,
    outputKeys: Object.keys(output.outputs),
    inputHash,
    outputHash,
    manifestHash: manifestHash(signalKey, params, inputHash, outputHash),
    sdkVersion: SDK_VERSION,
  };
}
