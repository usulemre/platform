/**
 * Deterministic synthetic universes (development/test only). Each universe is a set of assets with a
 * `T×N` returns matrix generated from a seeded mulberry32 PRNG under a simple factor model (a common
 * market factor plus idiosyncratic noise and a small per-asset drift) — NO Math.random, NO
 * wall-clock — so the same `(seed, shape)` always yields the same data. This is mock DATA, not mock
 * optimization: the engine runs the REAL SDK optimizers over these returns.
 */
import { returnsMatrix } from '@platform/portfolio-optimization-sdk';
import type { Universe } from '../../domain/input';

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

/** Generate a deterministic universe under a one-factor return model. */
export function syntheticUniverse(
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

/** The catalog of named synthetic universes available in v1. */
export const SYNTHETIC_UNIVERSES: readonly Universe[] = [
  syntheticUniverse('univ-equity-10', 'US Equity (10 assets)', 10, 756, 0x1111_1111, 3),
  syntheticUniverse('univ-multi-6', 'Multi-Asset (6 assets)', 6, 1000, 0x2222_2222, 3),
  syntheticUniverse('univ-sector-12', 'Sector Portfolio (12 assets)', 12, 500, 0x3333_3333, 4),
];
