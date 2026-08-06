/**
 * Deterministic synthetic OHLCV data (development/test only). Uses a seeded mulberry32 PRNG — NO
 * Math.random, NO wall-clock — so the same `(seed, bars)` always yields the same dataset. This is
 * mock DATA, not mock calculation: the engine runs the REAL SDK calculations over these bars.
 */
import { toOhlcvSeries, type OhlcvBar, type OhlcvSeries } from '@platform/feature-calculation-sdk';

/** Seeded PRNG in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a deterministic geometric random-walk OHLCV series. */
export function syntheticBars(
  bars: number,
  seed: number,
  startPrice = 100,
  epochMs = 1_700_000_000_000,
): OhlcvBar[] {
  const rand = mulberry32(seed);
  const out: OhlcvBar[] = [];
  let price = startPrice;
  const day = 86_400_000;
  for (let i = 0; i < bars; i += 1) {
    const drift = (rand() - 0.5) * 0.02;
    const open = price;
    price = Math.max(1, price * (1 + drift));
    const close = price;
    const high = Math.max(open, close) * (1 + rand() * 0.008);
    const low = Math.min(open, close) * (1 - rand() * 0.008);
    const volume = Math.round(1000 + rand() * 9000);
    out.push({ time: epochMs + i * day, open, high, low, close, volume });
  }
  return out;
}

/** Generate a deterministic synthetic series. */
export function syntheticSeries(bars: number, seed: number): OhlcvSeries {
  return toOhlcvSeries(syntheticBars(bars, seed));
}

/** The catalog of named synthetic datasets available in v1. */
export const SYNTHETIC_DATASETS: readonly {
  readonly ref: string;
  readonly label: string;
  readonly bars: number;
  readonly seed: number;
}[] = [
  { ref: 'ds-equity-eod', label: 'US Equity EOD (synthetic)', bars: 1260, seed: 0x1111_1111 },
  { ref: 'ds-fx-spot', label: 'FX Spot Daily (synthetic)', bars: 2000, seed: 0x2222_2222 },
  { ref: 'ds-crypto-1h', label: 'Crypto 1h (synthetic)', bars: 4000, seed: 0x3333_3333 },
];
