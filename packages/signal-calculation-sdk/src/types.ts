/**
 * Core types for the Signal Calculation SDK — the production library that transforms quantitative
 * features into standardized trading signals.
 *
 * A **signal** is a per-bar directional value in `{ SHORT(-1), FLAT(0), LONG(+1) }` (some signals
 * are non-directional **gates** in `{0, 1}`, and confidence is a **unit** score in `[0, 1]`). All
 * signal generators are **causal** (point-in-time): the value at index `i` depends only on inputs
 * at indices `≤ i`, never the future (PIT-3 / CP-3). Warm-up positions are `NaN`; a `NaN` in a
 * required input propagates to `NaN`. Every generator is deterministic and free of hidden state.
 *
 * This SDK depends on `@platform/feature-calculation-sdk` for the underlying feature calculations
 * (SMA/EMA/RSI/MACD/Bollinger/ATR/…) — signals are computed FROM those real features.
 */
import { allocOutput, type NumberSeries } from '@platform/feature-calculation-sdk';

export type {
  NumberSeries,
  OhlcvBar,
  OhlcvSeries,
  FeatureKey,
} from '@platform/feature-calculation-sdk';
export {
  toOhlcvSeries,
  warmupLength,
  finiteCount,
  allocOutput,
  assertWindow,
} from '@platform/feature-calculation-sdk';

/** The three directional signal states. */
export const LONG = 1;
export const FLAT = 0;
export const SHORT = -1;

/** A valid directional signal value. */
export type SignalValue = -1 | 0 | 1;

/** A signal series — `Float64Array` of signal values with `NaN` in the warm-up region. */
export type SignalSeries = Float64Array;

/** Allocate a signal output pre-filled with `NaN` (the warm-up marker). */
export function allocSignal(length: number): Float64Array {
  return allocOutput(length);
}

/** The three semantic value kinds a signal generator can emit (drives range validation). */
export type SignalValueKind = 'direction' | 'gate' | 'unit';

/** Map a raw magnitude to a ternary directional signal (sign). `NaN` stays `NaN`. */
export function sign(value: number): number {
  if (Number.isNaN(value)) return NaN;
  if (value > 0) return LONG;
  if (value < 0) return SHORT;
  return FLAT;
}

/** Whether a finite value is a valid member of a signal's declared value kind. */
export function isValidSignalValue(value: number, kind: SignalValueKind): boolean {
  if (!Number.isFinite(value)) return false;
  switch (kind) {
    case 'direction':
      return value === LONG || value === FLAT || value === SHORT;
    case 'gate':
      return value === 0 || value === 1;
    case 'unit':
      return value >= 0 && value <= 1;
  }
}

/** The distribution of a directional signal series. */
export interface SignalDistribution {
  readonly long: number;
  readonly short: number;
  readonly flat: number;
  /** Non-flat finite values (long + short). */
  readonly active: number;
  /** All finite values. */
  readonly finite: number;
}

/** Count long/short/flat/active/finite values in a signal series. */
export function signalDistribution(signal: NumberSeries): SignalDistribution {
  let long = 0;
  let short = 0;
  let flat = 0;
  for (let i = 0; i < signal.length; i += 1) {
    const v = signal[i]!;
    if (!Number.isFinite(v)) continue;
    if (v > 0) long += 1;
    else if (v < 0) short += 1;
    else flat += 1;
  }
  return { long, short, flat, active: long + short, finite: long + short + flat };
}
