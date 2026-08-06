import { bench, describe } from 'vitest';
import { toOhlcvSeries } from '@platform/feature-calculation-sdk';
import {
  bollingerBreakout,
  compositeSignal,
  emaCrossover,
  maCrossover,
  macdCrossover,
  rsiThresholdSignal,
  volatilityBreakout,
  weightedAggregate,
  zScoreReversion,
} from '../src/index';

/** Deterministic synthetic OHLCV (mulberry32 PRNG — no Math.random, reproducible). */
function synthetic(
  n: number,
  seed = 0x51a6_1a2b,
): {
  close: Float64Array;
  high: Float64Array;
  low: Float64Array;
  volume: Float64Array;
  series: ReturnType<typeof toOhlcvSeries>;
} {
  let state = seed >>> 0;
  const rand = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const bars = [];
  let price = 100;
  for (let i = 0; i < n; i += 1) {
    price = Math.max(1, price * (1 + (rand() - 0.5) * 0.02));
    const high = price * (1 + rand() * 0.01);
    const low = price * (1 - rand() * 0.01);
    bars.push({ time: i, open: price, high, low, close: price, volume: 1000 + rand() * 9000 });
  }
  const series = toOhlcvSeries(bars);
  return { close: series.close, high: series.high, low: series.low, volume: series.volume, series };
}

const N = 50_000;
const { close, high, low, series } = synthetic(N);

describe(`signal generation over ${N} bars`, () => {
  bench('maCrossover(12,26)', () => void maCrossover(close, 12, 26));
  bench('emaCrossover(12,26)', () => void emaCrossover(close, 12, 26));
  bench('macdCrossover', () => void macdCrossover(close));
  bench('rsiThreshold(14)', () => void rsiThresholdSignal(close, 14));
  bench('bollingerBreakout(20)', () => void bollingerBreakout(close, 20));
  bench('volatilityBreakout(14)', () => void volatilityBreakout(high, low, close, 14));
  bench('zScoreReversion(20)', () => void zScoreReversion(close, 20));
  bench('composite', () => void compositeSignal(series));
  bench(
    'weightedAggregate',
    () =>
      void weightedAggregate([
        { signal: maCrossover(close, 12, 26), weight: 1 },
        { signal: rsiThresholdSignal(close, 14), weight: 1 },
      ]),
  );
});
