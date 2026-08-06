/**
 * The signal validation pipeline. Runs REAL, deterministic checks on a computed signal:
 *
 *  1. **Length** — the output length matches the dataset length.
 *  2. **Finite** — the generator produces at least one finite value.
 *  3. **Range** — every finite primary value is valid for the signal's declared value kind
 *     (direction ∈ {-1,0,1}, gate ∈ {0,1}, unit ∈ [0,1]). A malformed signal fails here.
 *  4. **Determinism** — recomputing yields a byte-identical result (RP-1 reproducibility).
 *  5. **Causality / point-in-time** — the signal computed over a truncated *prefix* of the dataset
 *     equals the corresponding prefix of the full computation. This proves the value at each index
 *     used no future information (PIT-3 / CP-3); a look-ahead leak would fail here.
 *
 * Pure and deterministic; no IO.
 */
import {
  describeSignal,
  finiteCount as sdkFiniteCount,
  isValidSignalValue,
  warmupLength,
  type OhlcvSeries,
  type SignalKey,
} from '@platform/signal-calculation-sdk';
import { getExecutor } from './executors';
import { hashFloat64 } from './hashing';
import type { SignalOutput, SignalParams, ValidationCheck, ValidationReport } from './models';

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
  signalKey: SignalKey,
  params: SignalParams,
  series: OhlcvSeries,
  output: SignalOutput,
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
  checks.push({
    id: 'finite',
    label: 'Produces finite values',
    passed: finite > 0,
    detail: `${finite} finite of ${primary.length}`,
  });

  const valueKind = describeSignal(signalKey)?.valueKind ?? 'direction';
  let invalid = 0;
  for (let i = 0; i < primary.length; i += 1) {
    const v = primary[i]!;
    if (Number.isFinite(v) && !isValidSignalValue(v, valueKind)) invalid += 1;
  }
  checks.push({
    id: 'range',
    label: `Valid ${valueKind} values`,
    passed: invalid === 0,
    detail:
      invalid === 0 ? `all values are valid ${valueKind} values` : `${invalid} out-of-range values`,
  });

  const executor = getExecutor(signalKey);
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
export function primaryWarmup(output: SignalOutput): number {
  return warmupLength(output.outputs[output.primaryKey]!);
}
