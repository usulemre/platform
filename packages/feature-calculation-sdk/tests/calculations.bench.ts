import { bench, describe } from 'vitest';
import { atr, bollingerBands, ema, macd, rollingStd, rsi, sma, vwap, zScore } from '../src/index';

/** Deterministic synthetic close series (mulberry32 PRNG — no Math.random, reproducible). */
function synthetic(
  n: number,
  seed = 0x9e3779b9,
): { close: Float64Array; high: Float64Array; low: Float64Array; volume: Float64Array } {
  let state = seed >>> 0;
  const rand = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const close = new Float64Array(n);
  const high = new Float64Array(n);
  const low = new Float64Array(n);
  const volume = new Float64Array(n);
  let price = 100;
  for (let i = 0; i < n; i += 1) {
    price *= 1 + (rand() - 0.5) * 0.02;
    close[i] = price;
    high[i] = price * (1 + rand() * 0.01);
    low[i] = price * (1 - rand() * 0.01);
    volume[i] = 1000 + rand() * 9000;
  }
  return { close, high, low, volume };
}

const N = 50_000;
const { close, high, low, volume } = synthetic(N);

describe(`feature calculations over ${N} bars`, () => {
  bench('sma(20)', () => void sma(close, 20));
  bench('ema(20)', () => void ema(close, 20));
  bench('rollingStd(20)', () => void rollingStd(close, 20));
  bench('zScore(20)', () => void zScore(close, 20));
  bench('rsi(14)', () => void rsi(close, 14));
  bench('macd(12,26,9)', () => void macd(close));
  bench('bollingerBands(20)', () => void bollingerBands(close, 20));
  bench('atr(14)', () => void atr(high, low, close, 14));
  bench('vwap', () => void vwap(high, low, close, volume));
});
