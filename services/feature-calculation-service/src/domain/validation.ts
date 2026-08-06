/**
 * The feature validation pipeline. Runs REAL, deterministic checks on a computed feature:
 *
 *  1. **Length** — the output length matches the dataset length.
 *  2. **Finite** — the calculation produces at least one finite value.
 *  3. **Determinism** — recomputing yields a byte-identical result (RP-1 reproducibility).
 *  4. **Causality / point-in-time** — the feature computed over a truncated *prefix* of the
 *     dataset equals the corresponding prefix of the full computation. This proves the value at
 *     each index used no future information (PIT-3 / CP-3); a look-ahead leak would fail here.
 *
 * Pure and deterministic; no IO.
 */
import {
  finiteCount as sdkFiniteCount,
  warmupLength,
  type FeatureKey,
  type OhlcvSeries,
} from '@platform/feature-calculation-sdk';
import { getExecutor } from './executors';
import { hashFloat64 } from './hashing';
import type { FeatureOutput, FeatureParams, ValidationCheck, ValidationReport } from './models';

/** A zero-copy prefix view of an OHLCV series (first `end` bars). */
function prefixSeries(series: OhlcvSeries, end: number): OhlcvSeries {
  return {
    time: series.time.subarray(0, end),
    open: series.open.subarray(0, end),
    high: series.high.subarray(0, end),
    low: series.low.subarray(0, end),
    close: series.close.subarray(0, end),
    volume: series.volume.subarray(0, end),
    length: end,
  };
}

function equalPrefix(a: Float64Array, b: Float64Array, end: number): boolean {
  for (let i = 0; i < end; i += 1) {
    const x = a[i]!;
    const y = b[i]!;
    if (Number.isNaN(x) && Number.isNaN(y)) continue;
    if (x !== y) return false;
  }
  return true;
}

export function validateResult(
  featureKey: FeatureKey,
  params: FeatureParams,
  series: OhlcvSeries,
  output: FeatureOutput,
): ValidationReport {
  const primary = output.outputs[output.primaryKey]!;
  const checks: ValidationCheck[] = [];

  const lengthOk = output.length === series.length;
  checks.push({
    id: 'length',
    label: 'Output length matches dataset',
    passed: lengthOk,
    detail: `output ${output.length} vs dataset ${series.length}`,
  });

  const finite = sdkFiniteCount(primary);
  const finiteOk = finite > 0;
  checks.push({
    id: 'finite',
    label: 'Produces finite values',
    passed: finiteOk,
    detail: `${finite} finite of ${primary.length}`,
  });

  const executor = getExecutor(featureKey);
  const rerun = executor(series, params);
  const deterministic = hashFloat64(rerun.outputs[rerun.primaryKey]!) === hashFloat64(primary);
  checks.push({
    id: 'determinism',
    label: 'Deterministic on recompute',
    passed: deterministic,
    detail: deterministic ? 'byte-identical' : 'mismatch',
  });

  const prefixEnd = Math.max(1, Math.floor(series.length * 0.6));
  let causal = true;
  if (prefixEnd < series.length) {
    const prefixOut = executor(prefixSeries(series, prefixEnd), params);
    causal = equalPrefix(prefixOut.outputs[prefixOut.primaryKey]!, primary, prefixEnd);
  }
  checks.push({
    id: 'causality',
    label: 'Point-in-time (no look-ahead)',
    passed: causal,
    detail: causal ? `prefix[0..${prefixEnd}) matches full` : 'future value affected a past output',
  });

  return { passed: checks.every((check) => check.passed), checks };
}

/** Warm-up length of the primary output (leading NaNs). */
export function primaryWarmup(output: FeatureOutput): number {
  return warmupLength(output.outputs[output.primaryKey]!);
}
