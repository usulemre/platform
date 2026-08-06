/**
 * The **Threshold Engine** — the low-level threshold/crossover evaluators every directional signal
 * is built from. Pure, deterministic, causal and NaN-aware; each maps one or more numeric series to
 * a signal series in `{ -1, 0, 1 }` (or `NaN` during warm-up).
 */
import { allocSignal, FLAT, LONG, SHORT, type NumberSeries, type SignalValue } from './types';

/** The crossover primitive: `sign(fast - slow)` per index. `NaN` if either input is `NaN`. */
export function crossoverSignal(fast: NumberSeries, slow: NumberSeries): Float64Array {
  const n = fast.length;
  if (slow.length !== n) throw new RangeError('fast/slow length mismatch');
  const out = allocSignal(n);
  for (let i = 0; i < n; i += 1) {
    const f = fast[i]!;
    const s = slow[i]!;
    if (Number.isNaN(f) || Number.isNaN(s)) continue;
    out[i] = f > s ? LONG : f < s ? SHORT : FLAT;
  }
  return out;
}

/** A two-sided threshold band with the signal emitted below the lower and above the upper bound. */
export interface ThresholdBand {
  readonly lower: number;
  readonly upper: number;
  readonly belowLowerSignal: SignalValue;
  readonly aboveUpperSignal: SignalValue;
}

/**
 * Map a scalar series to a directional signal by a two-sided threshold band: below `lower` ⇒
 * `belowLowerSignal`, above `upper` ⇒ `aboveUpperSignal`, inside the band ⇒ `FLAT`. Used by
 * oscillator signals such as RSI (oversold → long, overbought → short) and z-score reversion.
 */
export function thresholdSignal(values: NumberSeries, band: ThresholdBand): Float64Array {
  if (band.lower > band.upper)
    throw new RangeError(`lower (${band.lower}) must be ≤ upper (${band.upper})`);
  const out = allocSignal(values.length);
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i]!;
    if (Number.isNaN(v)) continue;
    out[i] = v < band.lower ? band.belowLowerSignal : v > band.upper ? band.aboveUpperSignal : FLAT;
  }
  return out;
}

/**
 * Breakout evaluator: `LONG` when `price > upper`, `SHORT` when `price < lower`, else `FLAT`. All
 * three inputs must be finite at index `i` (upper/lower are typically band series such as Bollinger
 * Bands). Requires `upper ≥ lower` where both are finite.
 */
export function breakoutSignal(
  price: NumberSeries,
  upper: NumberSeries,
  lower: NumberSeries,
): Float64Array {
  const n = price.length;
  if (upper.length !== n || lower.length !== n)
    throw new RangeError('price/upper/lower length mismatch');
  const out = allocSignal(n);
  for (let i = 0; i < n; i += 1) {
    const p = price[i]!;
    const u = upper[i]!;
    const l = lower[i]!;
    if (Number.isNaN(p) || Number.isNaN(u) || Number.isNaN(l)) continue;
    out[i] = p > u ? LONG : p < l ? SHORT : FLAT;
  }
  return out;
}

/**
 * Level evaluator: `aboveSignal` when `value > level + band`, `belowSignal` when
 * `value < level - band`, else `FLAT`. The symmetric `band` (default 0) gives a neutral dead-zone
 * around the level (used by ROC / momentum threshold signals with `level = 0`).
 */
export function levelSignal(
  values: NumberSeries,
  level: number,
  aboveSignal: SignalValue,
  belowSignal: SignalValue,
  band = 0,
): Float64Array {
  if (band < 0) throw new RangeError(`band must be ≥ 0, received ${band}`);
  const out = allocSignal(values.length);
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i]!;
    if (Number.isNaN(v)) continue;
    out[i] = v > level + band ? aboveSignal : v < level - band ? belowSignal : FLAT;
  }
  return out;
}

/** Gate evaluator: `1` when `value ≥ threshold`, else `0`. `NaN` propagates. */
export function gateSignal(values: NumberSeries, threshold: number): Float64Array {
  const out = allocSignal(values.length);
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i]!;
    if (Number.isNaN(v)) continue;
    out[i] = v >= threshold ? 1 : 0;
  }
  return out;
}
