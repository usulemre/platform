/**
 * Oscillators — Relative Strength Index (Wilder) and Moving Average Convergence Divergence.
 * All causal, deterministic and NaN-aware.
 */
import { allocOutput, assertWindow, type NumberSeries } from './types';
import { ema } from './moving-averages';

function rsiFromAverages(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Relative Strength Index (Wilder smoothing) over `window` (default 14). The first RSI is at
 * index `window` (it needs `window` price changes). Seeds `avgGain`/`avgLoss` with the simple
 * mean of the first `window` changes, then applies Wilder smoothing:
 * `avg = (prevAvg·(window-1) + current) / window`.
 *
 * Edge cases: an all-gains window gives RSI 100; a flat window gives RSI 50. NaN policy mirrors
 * `ema` — leading `NaN`s reset seeding; a later `NaN` change yields `NaN` and holds the running
 * averages.
 */
export function rsi(values: NumberSeries, window = 14): Float64Array {
  assertWindow(window);
  const n = values.length;
  const out = allocOutput(n);
  let avgGain = NaN;
  let avgLoss = NaN;
  let seeded = false;
  let seedGain = 0;
  let seedLoss = 0;
  let seedCount = 0;
  for (let i = 1; i < n; i += 1) {
    const cur = values[i]!;
    const prev = values[i - 1]!;
    const delta = Number.isNaN(cur) || Number.isNaN(prev) ? NaN : cur - prev;
    if (!seeded) {
      if (Number.isNaN(delta)) {
        seedGain = 0;
        seedLoss = 0;
        seedCount = 0;
        continue;
      }
      seedGain += Math.max(delta, 0);
      seedLoss += Math.max(-delta, 0);
      seedCount += 1;
      if (seedCount === window) {
        avgGain = seedGain / window;
        avgLoss = seedLoss / window;
        seeded = true;
        out[i] = rsiFromAverages(avgGain, avgLoss);
      }
    } else if (Number.isNaN(delta)) {
      out[i] = NaN;
    } else {
      avgGain = (avgGain * (window - 1) + Math.max(delta, 0)) / window;
      avgLoss = (avgLoss * (window - 1) + Math.max(-delta, 0)) / window;
      out[i] = rsiFromAverages(avgGain, avgLoss);
    }
  }
  return out;
}

/** MACD result: the MACD line, its signal line and the histogram (difference). */
export interface Macd {
  readonly macd: Float64Array;
  readonly signal: Float64Array;
  readonly histogram: Float64Array;
}

/**
 * Moving Average Convergence Divergence. `macd = EMA(fast) - EMA(slow)`; `signal =
 * EMA(macd, signalWindow)`; `histogram = macd - signal`. Defaults: fast 12, slow 26, signal 9.
 * The `signal` EMA seeds only once the `macd` line is finite, so warm-up is handled correctly.
 */
export function macd(values: NumberSeries, fast = 12, slow = 26, signalWindow = 9): Macd {
  assertWindow(fast, 'fast');
  assertWindow(slow, 'slow');
  assertWindow(signalWindow, 'signalWindow');
  if (fast >= slow) throw new RangeError(`fast (${fast}) must be < slow (${slow})`);
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const n = values.length;
  const macdLine = allocOutput(n);
  for (let i = 0; i < n; i += 1) {
    const f = fastEma[i]!;
    const s = slowEma[i]!;
    if (Number.isNaN(f) || Number.isNaN(s)) continue;
    macdLine[i] = f - s;
  }
  const signal = ema(macdLine, signalWindow);
  const histogram = allocOutput(n);
  for (let i = 0; i < n; i += 1) {
    const m = macdLine[i]!;
    const sig = signal[i]!;
    if (Number.isNaN(m) || Number.isNaN(sig)) continue;
    histogram[i] = m - sig;
  }
  return { macd: macdLine, signal, histogram };
}
