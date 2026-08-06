/**
 * Filter / confirmation signals — volume confirmation, ATR (volatility-regime) filter and trend
 * filter. Volume confirmation and the ATR filter are non-directional **gates** in `{0, 1}` (used to
 * confirm or veto directional signals); the trend filter is directional in `{ -1, 0, 1 }` (the
 * prevailing regime). All compute the underlying real features via
 * `@platform/feature-calculation-sdk`. Causal, deterministic, NaN-aware.
 */
import { atr, sma, type NumberSeries } from '@platform/feature-calculation-sdk';
import { crossoverSignal } from './threshold-engine';
import { allocSignal } from './types';

/**
 * Volume Confirmation gate: `1` when the current volume exceeds its `window`-period average times
 * `multiplier` (an above-average-participation bar), else `0`. Non-directional — combine it with a
 * directional signal to require volume backing. Default: window 20, multiplier 1.5.
 */
export function volumeConfirmation(
  volume: NumberSeries,
  window = 20,
  multiplier = 1.5,
): Float64Array {
  if (multiplier <= 0) throw new RangeError(`multiplier must be > 0, received ${multiplier}`);
  const avg = sma(volume, window);
  const n = volume.length;
  const out = allocSignal(n);
  for (let i = 0; i < n; i += 1) {
    const v = volume[i]!;
    const a = avg[i]!;
    if (Number.isNaN(v) || Number.isNaN(a)) continue;
    out[i] = v > a * multiplier ? 1 : 0;
  }
  return out;
}

/**
 * ATR (volatility-regime) filter gate: `1` when the ATR normalized by price (`ATR / close`) is at
 * or above `minPct` — i.e. there is enough volatility to trade — else `0`. Vetoes signals in dead,
 * untradeable regimes. Default: window 14, minPct 0.005 (0.5%).
 */
export function atrFilter(
  high: NumberSeries,
  low: NumberSeries,
  close: NumberSeries,
  window = 14,
  minPct = 0.005,
): Float64Array {
  if (minPct < 0) throw new RangeError(`minPct must be ≥ 0, received ${minPct}`);
  const range = atr(high, low, close, window);
  const n = close.length;
  const out = allocSignal(n);
  for (let i = 0; i < n; i += 1) {
    const a = range[i]!;
    const c = close[i]!;
    if (Number.isNaN(a) || Number.isNaN(c) || c === 0) continue;
    out[i] = a / c >= minPct ? 1 : 0;
  }
  return out;
}

/**
 * Trend filter (directional regime): `LONG` when the close is above its `window`-period SMA,
 * `SHORT` when below, `FLAT` when equal. Used to gate directional signals to the prevailing trend.
 * Default window 50.
 */
export function trendFilter(close: NumberSeries, window = 50): Float64Array {
  return crossoverSignal(close, sma(close, window));
}
