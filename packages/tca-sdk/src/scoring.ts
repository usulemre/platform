/**
 * Execution efficiency and quality scoring — REAL, pure, deterministic. Efficiency measures where the
 * realised price fell within the interval's benchmark price range; the quality score is a weighted
 * blend of normalised cost, impact, commission, efficiency and participation sub-scores mapped onto a
 * 0–100 scale with a letter grade. These are transparent scoring rules (DE-4), not opaque models.
 */
import type { BenchmarkPrices, ExecutionQuality, ExecutionScore, Side } from './types';

/** Clamp a value to `[lo, hi]`. */
function clamp(value: number, lo: number, hi: number): number {
  return value < lo ? lo : value > hi ? hi : value;
}

/**
 * Execution Efficiency in `[0, 1]` — the fraction of the interval benchmark price range captured in
 * the client's favour. `1` means the execution matched the best benchmark price, `0` the worst. The
 * range spans arrival/VWAP/TWAP/open/close/mid. Returns `1` for a degenerate (zero-width) range.
 */
export function executionEfficiency(
  execPrice: number,
  prices: BenchmarkPrices,
  side: Side,
): number {
  const refs = [prices.arrival, prices.vwap, prices.twap, prices.open, prices.close, prices.mid];
  let lo = refs[0]!;
  let hi = refs[0]!;
  for (const r of refs) {
    if (r < lo) lo = r;
    if (r > hi) hi = r;
  }
  const width = hi - lo;
  if (width <= 0) return 1;
  const raw = side === 'BUY' ? (hi - execPrice) / width : (execPrice - lo) / width;
  return clamp(raw, 0, 1);
}

/** Map a cost in basis points onto a 0–100 sub-score: `0 bps → 100`, `worstBps → 0`, negative → 100. */
function costScore(bps: number, worstBps: number): number {
  return clamp((worstBps - bps) / worstBps, 0, 1) * 100;
}

/** Letter grade for a 0–100 score. */
export function gradeFor(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export interface QualityInput {
  readonly slippageBps: number;
  readonly marketImpactBps: number;
  readonly commissionBps: number;
  readonly efficiency: number;
  readonly participationRate: number;
}

/** The weighted sub-scores that make up the composite execution score. */
const WEIGHTS = {
  slippage: 0.35,
  impact: 0.25,
  commission: 0.15,
  efficiency: 0.15,
  participation: 0.1,
} as const;
const WORST = { slippageBps: 50, impactBps: 30, commissionBps: 20 } as const;

/** The composite execution score (0–100) with its weighted components and letter grade. */
export function executionScore(input: QualityInput): ExecutionScore {
  const slippage = costScore(input.slippageBps, WORST.slippageBps);
  const impact = costScore(input.marketImpactBps, WORST.impactBps);
  const commission = costScore(input.commissionBps, WORST.commissionBps);
  const efficiency = clamp(input.efficiency, 0, 1) * 100;
  const participation = (1 - clamp(input.participationRate, 0, 1)) * 100;
  const components = [
    { label: 'Slippage', score: slippage, weight: WEIGHTS.slippage },
    { label: 'Market impact', score: impact, weight: WEIGHTS.impact },
    { label: 'Commission', score: commission, weight: WEIGHTS.commission },
    { label: 'Efficiency', score: efficiency, weight: WEIGHTS.efficiency },
    { label: 'Participation', score: participation, weight: WEIGHTS.participation },
  ];
  const score = components.reduce((acc, c) => acc + c.score * c.weight, 0);
  return { score, grade: gradeFor(score), components };
}

/** The execution-quality summary combining the score with its underlying cost drivers. */
export function executionQuality(input: QualityInput): ExecutionQuality {
  const scored = executionScore(input);
  return {
    score: scored.score,
    grade: scored.grade,
    efficiency: clamp(input.efficiency, 0, 1),
    slippageBps: input.slippageBps,
    marketImpactBps: input.marketImpactBps,
    commissionBps: input.commissionBps,
    participationRate: input.participationRate,
  };
}
