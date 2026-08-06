/**
 * Breakout & volatility signals — Bollinger Band breakouts and ATR-scaled volatility breakouts.
 * Both compute the underlying real features (Bollinger Bands / ATR) via
 * `@platform/feature-calculation-sdk`. Causal, deterministic, NaN-aware.
 */
import { atr, bollingerBands, type NumberSeries } from '@platform/feature-calculation-sdk';
import { breakoutSignal } from './threshold-engine';
import { allocSignal, LONG, SHORT } from './types';

/**
 * Bollinger Band Breakout. `LONG` when the close breaks above the upper band, `SHORT` when it
 * breaks below the lower band, else `FLAT`. Uses the population-std Bollinger Bands (TA-Lib
 * convention). Defaults: window 20, k 2.
 */
export function bollingerBreakout(close: NumberSeries, window = 20, k = 2): Float64Array {
  const bands = bollingerBands(close, window, k);
  return breakoutSignal(close, bands.upper, bands.lower);
}

/**
 * Volatility Breakout. A directional breakout scaled by the Average True Range: when the one-bar
 * move `close[i] - close[i-1]` exceeds `+k · ATR[i]` ⇒ `LONG`; below `-k · ATR[i]` ⇒ `SHORT`; else
 * `FLAT`. The ATR normalization makes the threshold adapt to the instrument's volatility regime.
 * Defaults: ATR window 14, k 1.
 */
export function volatilityBreakout(
  high: NumberSeries,
  low: NumberSeries,
  close: NumberSeries,
  window = 14,
  k = 1,
): Float64Array {
  if (k <= 0) throw new RangeError(`k must be > 0, received ${k}`);
  const range = atr(high, low, close, window);
  const n = close.length;
  const out = allocSignal(n);
  for (let i = 1; i < n; i += 1) {
    const a = range[i]!;
    const cur = close[i]!;
    const prev = close[i - 1]!;
    if (Number.isNaN(a) || Number.isNaN(cur) || Number.isNaN(prev)) continue;
    const move = cur - prev;
    const band = k * a;
    out[i] = move > band ? LONG : move < -band ? SHORT : 0;
  }
  return out;
}
