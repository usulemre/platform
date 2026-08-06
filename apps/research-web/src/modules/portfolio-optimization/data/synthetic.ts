/**
 * Deterministic synthetic universes for the UI (mock DATA, not mock optimization). Seeded mulberry32
 * PRNG factor-model returns — no Math.random — so results are reproducible. The Portfolio
 * Optimization Engine's REAL SDK optimizers run over these returns. Refs/seeds match the service.
 */
import { returnsMatrix, type Matrix } from '@platform/portfolio-optimization-sdk';

export interface Universe {
  readonly ref: string;
  readonly label: string;
  readonly assets: readonly string[];
  readonly returns: Matrix;
  readonly sectors: readonly string[];
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function syntheticUniverse(
  ref: string,
  label: string,
  assetCount: number,
  periods: number,
  seed: number,
  sectorCount: number,
): Universe {
  const rand = mulberry32(seed);
  const sectors: string[] = [];
  const loadings: number[] = [];
  const drift: number[] = [];
  for (let a = 0; a < assetCount; a += 1) {
    sectors.push(`Sector-${(a % sectorCount) + 1}`);
    loadings.push(0.4 + rand() * 0.9);
    drift.push((rand() - 0.5) * 0.0008);
  }
  const rows: number[][] = [];
  for (let p = 0; p < periods; p += 1) {
    const market = (rand() - 0.5) * 0.02;
    const row: number[] = [];
    for (let a = 0; a < assetCount; a += 1)
      row.push(loadings[a]! * market + (rand() - 0.5) * 0.02 + drift[a]!);
    rows.push(row);
  }
  return {
    ref,
    label,
    assets: Array.from({ length: assetCount }, (_, i) => `A${i + 1}`),
    returns: returnsMatrix(rows),
    sectors,
  };
}

export const UNIVERSES: readonly Universe[] = [
  syntheticUniverse('univ-equity-10', 'US Equity (10 assets)', 10, 756, 0x1111_1111, 3),
  syntheticUniverse('univ-multi-6', 'Multi-Asset (6 assets)', 6, 1000, 0x2222_2222, 3),
  syntheticUniverse('univ-sector-12', 'Sector Portfolio (12 assets)', 12, 500, 0x3333_3333, 4),
];

const cache = new Map<string, Universe>();

/** Resolve a universe by ref (memoized). */
export function getUniverse(universeRef: string): Universe {
  const existing = cache.get(universeRef);
  if (existing) return existing;
  const universe = UNIVERSES.find((entry) => entry.ref === universeRef);
  if (!universe) throw new RangeError(`unknown universe '${universeRef}'`);
  cache.set(universeRef, universe);
  return universe;
}
