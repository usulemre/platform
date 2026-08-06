/**
 * Crossover signals — moving-average, EMA and MACD crossovers, plus the MACD histogram sign. Each
 * computes the underlying real features via `@platform/feature-calculation-sdk`, then reduces them
 * to a directional signal through the Threshold Engine. Causal, deterministic, NaN-aware.
 */
import { ema, macd, sma, type NumberSeries } from '@platform/feature-calculation-sdk';
import { crossoverSignal } from './threshold-engine';
import { allocSignal, sign } from './types';

/**
 * Moving-Average Crossover: `sign(SMA(fast) - SMA(slow))`. `LONG` when the fast average is above
 * the slow (up-trend), `SHORT` when below. Requires `fast < slow`.
 */
export function maCrossover(close: NumberSeries, fast = 12, slow = 26): Float64Array {
  if (fast >= slow) throw new RangeError(`fast (${fast}) must be < slow (${slow})`);
  return crossoverSignal(sma(close, fast), sma(close, slow));
}

/** EMA Crossover: `sign(EMA(fast) - EMA(slow))`. Reacts faster than the SMA crossover. */
export function emaCrossover(close: NumberSeries, fast = 12, slow = 26): Float64Array {
  if (fast >= slow) throw new RangeError(`fast (${fast}) must be < slow (${slow})`);
  return crossoverSignal(ema(close, fast), ema(close, slow));
}

/**
 * MACD Crossover: `sign(MACD - signal)`. `LONG` when the MACD line is above its signal line,
 * `SHORT` when below.
 */
export function macdCrossover(
  close: NumberSeries,
  fast = 12,
  slow = 26,
  signalWindow = 9,
): Float64Array {
  const result = macd(close, fast, slow, signalWindow);
  return crossoverSignal(result.macd, result.signal);
}

/**
 * MACD Histogram signal: `sign(histogram)` = `sign(MACD - signal)`. `LONG` while the histogram is
 * positive (momentum building up), `SHORT` while negative.
 */
export function macdHistogramSignal(
  close: NumberSeries,
  fast = 12,
  slow = 26,
  signalWindow = 9,
): Float64Array {
  const result = macd(close, fast, slow, signalWindow);
  const out = allocSignal(result.histogram.length);
  for (let i = 0; i < result.histogram.length; i += 1) {
    const h = result.histogram[i]!;
    if (Number.isNaN(h)) continue;
    out[i] = sign(h);
  }
  return out;
}
