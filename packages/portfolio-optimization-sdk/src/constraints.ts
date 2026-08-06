/**
 * The **Constraint Engine** — the feasible-set projection and constraint evaluation used by every
 * optimizer. It projects an arbitrary weight vector onto the constraint set (per-position box,
 * budget/cash, gross leverage, sector caps, liquidity) and, separately, evaluates whether a weight
 * vector satisfies each configured constraint (for validation and reports). Pure, deterministic and
 * convergent (bounded iterations). Handles numerical edge cases (empty free set, zero volatility).
 */
import { type ConstraintConfig, type OptimizationInput } from './types';

const TOL = 1e-6;
const MAX_PROJECTION_ITERS = 200;

/** The result of a single constraint evaluation. */
export interface ConstraintCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
}

/** Per-asset lower/upper weight bounds implied by the configuration. */
export function perAssetBounds(
  config: ConstraintConfig,
  input: OptimizationInput,
): { lo: Float64Array; hi: Float64Array } {
  const n = input.n;
  const lo = new Float64Array(n);
  const hi = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const liquidity = input.liquidityCaps?.[i] ?? Number.POSITIVE_INFINITY;
    const cap = Math.min(config.maxWeight, config.maxAssetExposure, liquidity);
    hi[i] = cap;
    lo[i] = config.longOnly
      ? Math.max(config.minWeight, 0)
      : -Math.min(config.maxAssetExposure, liquidity);
  }
  return { lo, hi };
}

/** Clip each weight into its `[lo, hi]` box (a real copy). */
function clip(w: Float64Array, lo: Float64Array, hi: Float64Array): Float64Array {
  const out = new Float64Array(w.length);
  for (let i = 0; i < w.length; i += 1) out[i] = Math.min(hi[i]!, Math.max(lo[i]!, w[i]!));
  return out;
}

/**
 * Project `w` onto `{ lo ≤ w ≤ hi, Σw = target }` by iterated clip-and-redistribute: clip to the
 * box, then spread the sum residual equally over the positions that can still move in the needed
 * direction, repeating until the budget is met or no position is free. Deterministic and bounded.
 */
export function projectToBudget(
  w: Float64Array,
  lo: Float64Array,
  hi: Float64Array,
  target: number,
): Float64Array {
  const current = clip(w, lo, hi);
  for (let iter = 0; iter < MAX_PROJECTION_ITERS; iter += 1) {
    let sum = 0;
    for (let i = 0; i < current.length; i += 1) sum += current[i]!;
    const residual = target - sum;
    if (Math.abs(residual) < TOL) break;
    const free: number[] = [];
    for (let i = 0; i < current.length; i += 1) {
      if (residual > 0 && current[i]! < hi[i]! - TOL) free.push(i);
      else if (residual < 0 && current[i]! > lo[i]! + TOL) free.push(i);
    }
    if (free.length === 0) break;
    const delta = residual / free.length;
    for (const i of free) current[i] = Math.min(hi[i]!, Math.max(lo[i]!, current[i]! + delta));
  }
  return current;
}

/** Scale `w` so gross leverage `Σ|wᵢ| ≤ maxLeverage`. */
export function enforceLeverage(w: Float64Array, maxLeverage: number): Float64Array {
  let gross = 0;
  for (let i = 0; i < w.length; i += 1) gross += Math.abs(w[i]!);
  if (gross <= maxLeverage + TOL || gross === 0) return w.slice();
  const scale = maxLeverage / gross;
  const out = new Float64Array(w.length);
  for (let i = 0; i < w.length; i += 1) out[i] = w[i]! * scale;
  return out;
}

/**
 * Enforce per-sector exposure caps: any sector whose summed weight exceeds `cap` is scaled down to
 * `cap`, then the whole vector is re-projected onto the budget so freed weight flows to other
 * assets. Iterated a few times to settle interactions between sectors.
 */
export function enforceSectorCaps(
  w: Float64Array,
  sectors: readonly string[],
  cap: number,
  lo: Float64Array,
  hi: Float64Array,
  target: number,
): Float64Array {
  if (!Number.isFinite(cap)) return w.slice();
  let current = w.slice();
  for (let iter = 0; iter < 10; iter += 1) {
    const sectorSum = new Map<string, number>();
    for (let i = 0; i < current.length; i += 1)
      sectorSum.set(sectors[i]!, (sectorSum.get(sectors[i]!) ?? 0) + current[i]!);
    let violated = false;
    for (const [sector, sum] of sectorSum) {
      if (sum > cap + TOL && sum > 0) {
        violated = true;
        const scale = cap / sum;
        for (let i = 0; i < current.length; i += 1)
          if (sectors[i] === sector) current[i] = current[i]! * scale;
      }
    }
    if (!violated) break;
    current = projectToBudget(current, lo, hi, target);
  }
  return current;
}

/**
 * Full projection of `w` onto the constraint set: box → budget (`Σw = 1 − cashReserve`) → sector
 * caps → gross leverage. Sector caps require `input.sectors`.
 */
export function projectToConstraints(
  w: Float64Array,
  config: ConstraintConfig,
  input: OptimizationInput,
): Float64Array {
  const { lo, hi } = perAssetBounds(config, input);
  const target = 1 - config.cashReserve;
  let current = projectToBudget(w, lo, hi, target);
  if (input.sectors && Number.isFinite(config.maxSectorExposure)) {
    current = enforceSectorCaps(current, input.sectors, config.maxSectorExposure, lo, hi, target);
  }
  current = enforceLeverage(current, config.maxLeverage);
  return current;
}

/** Limit turnover: scale the trade `w − prev` so `Σ|Δ| ≤ maxTurnover`. */
export function applyTurnoverLimit(
  w: Float64Array,
  previous: Float64Array,
  maxTurnover: number,
): Float64Array {
  if (!Number.isFinite(maxTurnover)) return w.slice();
  let total = 0;
  for (let i = 0; i < w.length; i += 1) total += Math.abs(w[i]! - previous[i]!);
  if (total <= maxTurnover + TOL || total === 0) return w.slice();
  const scale = maxTurnover / total;
  const out = new Float64Array(w.length);
  for (let i = 0; i < w.length; i += 1) out[i] = previous[i]! + (w[i]! - previous[i]!) * scale;
  return out;
}

/** Evaluate every configured constraint against a weight vector (for validation and reports). */
export function evaluateConstraints(
  w: Float64Array,
  config: ConstraintConfig,
  input: OptimizationInput,
): ConstraintCheck[] {
  const checks: ConstraintCheck[] = [];
  const { lo, hi } = perAssetBounds(config, input);

  const target = 1 - config.cashReserve;
  let net = 0;
  let gross = 0;
  let maxW = Number.NEGATIVE_INFINITY;
  let minW = Number.POSITIVE_INFINITY;
  let boxOk = true;
  for (let i = 0; i < w.length; i += 1) {
    net += w[i]!;
    gross += Math.abs(w[i]!);
    maxW = Math.max(maxW, w[i]!);
    minW = Math.min(minW, w[i]!);
    if (w[i]! < lo[i]! - TOL || w[i]! > hi[i]! + TOL) boxOk = false;
  }

  // Feasibility: net exposure cannot exceed the invested budget / leverage (holding extra cash is
  // always feasible — target-volatility and position-sizing methods legitimately under-invest).
  const budgetOk =
    net <= Math.max(target, config.maxLeverage) + 1e-4 &&
    (config.longOnly ? net >= -1e-4 : net >= -config.maxLeverage - 1e-4);
  checks.push({
    id: 'budget',
    label: 'Net exposure within budget',
    passed: budgetOk,
    detail: `Σw ${net.toFixed(4)} (target ${target.toFixed(4)}, leverage ${config.maxLeverage})`,
  });
  checks.push({
    id: 'box',
    label: 'Positions within [min, max] weight',
    passed: boxOk,
    detail: `range [${minW.toFixed(4)}, ${maxW.toFixed(4)}]`,
  });
  if (config.longOnly)
    checks.push({
      id: 'long_only',
      label: 'Long only (no negative weights)',
      passed: minW >= -TOL,
      detail: `min weight ${minW.toFixed(4)}`,
    });
  checks.push({
    id: 'leverage',
    label: 'Gross leverage within cap',
    passed: gross <= config.maxLeverage + 1e-4,
    detail: `Σ|w| ${gross.toFixed(4)} ≤ ${config.maxLeverage}`,
  });
  checks.push({
    id: 'asset_exposure',
    label: 'Per-asset exposure within cap',
    passed:
      maxW <= config.maxAssetExposure + TOL &&
      (config.longOnly || minW >= -config.maxAssetExposure - TOL),
    detail: `max |w| ${Math.max(Math.abs(maxW), Math.abs(minW)).toFixed(4)} ≤ ${config.maxAssetExposure}`,
  });

  if (input.sectors && Number.isFinite(config.maxSectorExposure)) {
    const sectorSum = new Map<string, number>();
    for (let i = 0; i < w.length; i += 1)
      sectorSum.set(input.sectors[i]!, (sectorSum.get(input.sectors[i]!) ?? 0) + w[i]!);
    let worst = 0;
    for (const sum of sectorSum.values()) worst = Math.max(worst, sum);
    checks.push({
      id: 'sector',
      label: 'Sector exposure within cap',
      passed: worst <= config.maxSectorExposure + TOL,
      detail: `max sector ${worst.toFixed(4)} ≤ ${config.maxSectorExposure}`,
    });
  }

  if (input.previousWeights && Number.isFinite(config.maxTurnover)) {
    let to = 0;
    for (let i = 0; i < w.length; i += 1) to += Math.abs(w[i]! - input.previousWeights[i]!);
    checks.push({
      id: 'turnover',
      label: 'Turnover within cap',
      passed: to <= config.maxTurnover + 1e-4,
      detail: `Σ|Δ| ${to.toFixed(4)} ≤ ${config.maxTurnover}`,
    });
  }

  return checks;
}
