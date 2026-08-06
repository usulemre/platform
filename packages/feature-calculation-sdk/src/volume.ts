/**
 * Volume-based calculations — cumulative VWAP, rolling volume and dollar volume. All causal,
 * deterministic and NaN-aware.
 */
import { allocOutput, assertWindow, type NumberSeries } from './types';
import { rollingSum } from './rolling';

/**
 * Cumulative (session) Volume-Weighted Average Price. `typical = (high+low+close)/3`;
 * `VWAP[i] = Σ typical·volume / Σ volume` over `0..i`. A bar with any `NaN` input (or the
 * running volume still being zero) yields `NaN` and is excluded from the running totals, so the
 * cumulative average stays well-defined.
 */
export function vwap(
  high: NumberSeries,
  low: NumberSeries,
  close: NumberSeries,
  volume: NumberSeries,
): Float64Array {
  const n = high.length;
  if (low.length !== n || close.length !== n || volume.length !== n)
    throw new RangeError('input length mismatch');
  const out = allocOutput(n);
  let cumTpv = 0;
  let cumVol = 0;
  for (let i = 0; i < n; i += 1) {
    const h = high[i]!;
    const l = low[i]!;
    const c = close[i]!;
    const vol = volume[i]!;
    if (!Number.isNaN(h) && !Number.isNaN(l) && !Number.isNaN(c) && !Number.isNaN(vol)) {
      const typical = (h + l + c) / 3;
      cumTpv += typical * vol;
      cumVol += vol;
    }
    if (cumVol > 0) out[i] = cumTpv / cumVol;
  }
  return out;
}

/** Rolling total traded volume over `window` (= rolling sum of `volume`). */
export function rollingVolume(volume: NumberSeries, window: number): Float64Array {
  assertWindow(window);
  return rollingSum(volume, window);
}

/** Per-bar dollar (notional) volume: `close · volume`. Any `NaN` input ⇒ `NaN`. */
export function dollarVolume(close: NumberSeries, volume: NumberSeries): Float64Array {
  const n = close.length;
  if (volume.length !== n) throw new RangeError('close/volume length mismatch');
  const out = allocOutput(n);
  for (let i = 0; i < n; i += 1) {
    const c = close[i]!;
    const v = volume[i]!;
    if (Number.isNaN(c) || Number.isNaN(v)) continue;
    out[i] = c * v;
  }
  return out;
}

/** Rolling dollar volume over `window` (= rolling sum of per-bar `close · volume`). */
export function rollingDollarVolume(
  close: NumberSeries,
  volume: NumberSeries,
  window: number,
): Float64Array {
  assertWindow(window);
  return rollingSum(dollarVolume(close, volume), window);
}
