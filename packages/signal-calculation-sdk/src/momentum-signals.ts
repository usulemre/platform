/**
 * Momentum & mean-reversion signals — RSI thresholds, rate-of-change, momentum breakout and
 * z-score mean reversion. Each derives the real feature (RSI/ROC/momentum/z-score) via
 * `@platform/feature-calculation-sdk`, then maps it to a directional signal through the Threshold
 * Engine. Causal, deterministic, NaN-aware.
 */
import {
  momentum,
  rateOfChange,
  rsi,
  zScore,
  type NumberSeries,
} from '@platform/feature-calculation-sdk';
import { levelSignal, thresholdSignal } from './threshold-engine';
import { LONG, SHORT } from './types';

/**
 * RSI Threshold signal. Oversold (`RSI < lower`) ⇒ `LONG`, overbought (`RSI > upper`) ⇒ `SHORT`,
 * else `FLAT` — the classic contrarian oscillator rule. Defaults: window 14, lower 30, upper 70.
 */
export function rsiThresholdSignal(
  close: NumberSeries,
  window = 14,
  lower = 30,
  upper = 70,
): Float64Array {
  return thresholdSignal(rsi(close, window), {
    lower,
    upper,
    belowLowerSignal: LONG,
    aboveUpperSignal: SHORT,
  });
}

/**
 * Rate-of-Change signal. `LONG` when `ROC > threshold`, `SHORT` when `ROC < -threshold`, else
 * `FLAT`. `threshold` is in percent (ROC units); default 0 gives a pure sign-of-momentum signal.
 */
export function rocSignal(close: NumberSeries, window = 10, threshold = 0): Float64Array {
  return levelSignal(rateOfChange(close, window), 0, LONG, SHORT, Math.abs(threshold));
}

/**
 * Momentum Breakout signal. `LONG` when the `window`-period momentum (`price[i] - price[i-window]`)
 * exceeds `+threshold`, `SHORT` when below `-threshold`, else `FLAT`.
 */
export function momentumBreakout(close: NumberSeries, window = 10, threshold = 0): Float64Array {
  return levelSignal(momentum(close, window), 0, LONG, SHORT, Math.abs(threshold));
}

/**
 * Z-Score Mean Reversion signal. When the rolling z-score falls below `-entry` the price is
 * stretched low ⇒ `LONG` (expect reversion up); above `+entry` ⇒ `SHORT`. Inside the band ⇒
 * `FLAT`. Note the contrarian sign (opposite the z-score). Default entry 2 standard deviations.
 */
export function zScoreReversion(close: NumberSeries, window = 20, entry = 2): Float64Array {
  if (entry <= 0) throw new RangeError(`entry must be > 0, received ${entry}`);
  return thresholdSignal(zScore(close, window), {
    lower: -entry,
    upper: entry,
    belowLowerSignal: LONG,
    aboveUpperSignal: SHORT,
  });
}
