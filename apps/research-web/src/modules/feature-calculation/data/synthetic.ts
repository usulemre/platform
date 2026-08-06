/**
 * Deterministic synthetic OHLCV datasets for the UI (mock DATA, not mock calculation). Seeded
 * mulberry32 PRNG — no Math.random — so results are reproducible. The Feature Calculation Engine's
 * REAL SDK calculations run over these bars.
 */
import { toOhlcvSeries, type OhlcvSeries } from '@platform/feature-calculation-sdk';

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function syntheticSeries(bars: number, seed: number): OhlcvSeries {
  const rand = mulberry32(seed);
  const rows = [];
  let price = 100;
  for (let i = 0; i < bars; i += 1) {
    const open = price;
    price = Math.max(1, price * (1 + (rand() - 0.5) * 0.02));
    const close = price;
    const high = Math.max(open, close) * (1 + rand() * 0.008);
    const low = Math.min(open, close) * (1 - rand() * 0.008);
    const volume = Math.round(1000 + rand() * 9000);
    rows.push({ time: 1_700_000_000_000 + i * 86_400_000, open, high, low, close, volume });
  }
  return toOhlcvSeries(rows);
}

export const DATASETS: readonly {
  readonly ref: string;
  readonly label: string;
  readonly bars: number;
  readonly seed: number;
}[] = [
  { ref: 'ds-equity-eod', label: 'US Equity EOD (synthetic)', bars: 1260, seed: 0x1111_1111 },
  { ref: 'ds-fx-spot', label: 'FX Spot Daily (synthetic)', bars: 2000, seed: 0x2222_2222 },
  { ref: 'ds-crypto-1h', label: 'Crypto 1h (synthetic)', bars: 4000, seed: 0x3333_3333 },
];

const cache = new Map<string, OhlcvSeries>();

/** Resolve a dataset series by ref (memoized). */
export function getSeries(datasetRef: string): OhlcvSeries {
  const existing = cache.get(datasetRef);
  if (existing) return existing;
  const dataset = DATASETS.find((entry) => entry.ref === datasetRef);
  if (!dataset) throw new RangeError(`unknown dataset '${datasetRef}'`);
  const series = syntheticSeries(dataset.bars, dataset.seed);
  cache.set(datasetRef, series);
  return series;
}
