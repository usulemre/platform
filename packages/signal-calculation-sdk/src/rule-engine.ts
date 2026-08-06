/**
 * The **Rule Engine** — a small, declarative, deterministic evaluator over named operand series.
 * A `Rule` compares a left operand (a named series) against a right operand (a constant or another
 * named series) with a comparator; a `RuleSet` combines rules with `all` (AND) / `any` (OR); a
 * `SignalRules` maps long/short rule-sets to a directional signal. This is how composite,
 * multi-feature signals are expressed without hand-writing per-index logic.
 *
 * Boolean series are represented as `Float64Array` of `1` (true), `0` (false) or `NaN` (undefined
 * — e.g. warm-up or a `NaN` operand). All evaluation is causal: `crosses_*` looks only at `i` and
 * `i-1`, never the future. Pure and NaN-aware.
 */
import { allocSignal, FLAT, LONG, SHORT, type NumberSeries } from './types';

/** Comparators supported by the rule engine. `crosses_*` are causal edge detectors. */
export type Comparator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'crosses_above' | 'crosses_below';

/** The right-hand operand: a constant or a reference to another bound series. */
export type Operand = number | { readonly ref: string };

/** A single comparison rule. `left` names a bound series; `right` is a constant or a `ref`. */
export interface Rule {
  readonly left: string;
  readonly op: Comparator;
  readonly right: Operand;
}

/** How the rules of a set combine. */
export type Combine = 'all' | 'any';

/** A combined set of rules. */
export interface RuleSet {
  readonly rules: readonly Rule[];
  readonly combine: Combine;
}

/** Long/short rule-sets producing a directional signal. */
export interface SignalRules {
  readonly long: RuleSet;
  readonly short: RuleSet;
}

/** Named operand series bound at evaluation time. */
export type Bindings = Readonly<Record<string, NumberSeries>>;

function resolve(operand: Operand, bindings: Bindings): NumberSeries | number {
  if (typeof operand === 'number') return operand;
  const series = bindings[operand.ref];
  if (!series) throw new RangeError(`unbound operand '${operand.ref}'`);
  return series;
}

function at(operand: NumberSeries | number, index: number): number {
  return typeof operand === 'number' ? operand : operand[index]!;
}

/**
 * Evaluate a single rule → a boolean series (`1`/`0`/`NaN`). A rule is `NaN` at `i` when a required
 * operand value is `NaN`; `crosses_*` are additionally `NaN` at `i = 0` (no prior bar).
 */
export function evaluateRule(rule: Rule, bindings: Bindings): Float64Array {
  const left = bindings[rule.left];
  if (!left) throw new RangeError(`unbound operand '${rule.left}'`);
  const right = resolve(rule.right, bindings);
  const n = left.length;
  const out = allocSignal(n);
  for (let i = 0; i < n; i += 1) {
    const l = left[i]!;
    const r = at(right, i);
    if (Number.isNaN(l) || Number.isNaN(r)) continue;
    switch (rule.op) {
      case 'gt':
        out[i] = l > r ? 1 : 0;
        break;
      case 'gte':
        out[i] = l >= r ? 1 : 0;
        break;
      case 'lt':
        out[i] = l < r ? 1 : 0;
        break;
      case 'lte':
        out[i] = l <= r ? 1 : 0;
        break;
      case 'eq':
        out[i] = l === r ? 1 : 0;
        break;
      case 'crosses_above':
      case 'crosses_below': {
        if (i === 0) break;
        const lPrev = left[i - 1]!;
        const rPrev = at(right, i - 1);
        if (Number.isNaN(lPrev) || Number.isNaN(rPrev)) break;
        if (rule.op === 'crosses_above') out[i] = lPrev <= rPrev && l > r ? 1 : 0;
        else out[i] = lPrev >= rPrev && l < r ? 1 : 0;
        break;
      }
    }
  }
  return out;
}

/**
 * Evaluate a rule-set → a boolean series. `all` is the AND of its rules (`1` only where every rule
 * is `1`; `0` where any is `0`); `any` is the OR (`1` where any rule is `1`). An index is `NaN`
 * only when the combination is undefined because of `NaN` operands (for `all`: a `NaN` rule with no
 * `0`; for `any`: a `NaN` rule with no `1`). An empty rule-set is vacuously `1` everywhere it has a
 * length reference.
 */
export function evaluateRuleSet(set: RuleSet, bindings: Bindings): Float64Array {
  const evaluated = set.rules.map((rule) => evaluateRule(rule, bindings));
  const n = evaluated.length > 0 ? evaluated[0]!.length : lengthOf(bindings);
  const out = allocSignal(n);
  for (let i = 0; i < n; i += 1) {
    if (evaluated.length === 0) {
      out[i] = 1;
      continue;
    }
    let decided = false;
    let sawNan = false;
    for (const series of evaluated) {
      const v = series[i]!;
      if (Number.isNaN(v)) {
        sawNan = true;
        continue;
      }
      if (set.combine === 'all' && v === 0) {
        out[i] = 0;
        decided = true;
        break;
      }
      if (set.combine === 'any' && v === 1) {
        out[i] = 1;
        decided = true;
        break;
      }
    }
    if (decided) continue;
    // No short-circuit hit: undefined if any operand was NaN, else the identity of the combine.
    if (sawNan) continue;
    out[i] = set.combine === 'all' ? 1 : 0;
  }
  return out;
}

function lengthOf(bindings: Bindings): number {
  for (const key of Object.keys(bindings)) return bindings[key]!.length;
  return 0;
}

/**
 * Evaluate long/short rule-sets into a directional signal: `LONG` where the long set is true,
 * `SHORT` where the short set is true, else `FLAT`. If both fire at the same index the result is
 * `FLAT` (the conflicting rules cancel — never a look-ahead-free way to pick). `NaN` where both
 * sets are undefined.
 */
export function ruleSignal(rules: SignalRules, bindings: Bindings): Float64Array {
  const longSeries = evaluateRuleSet(rules.long, bindings);
  const shortSeries = evaluateRuleSet(rules.short, bindings);
  const n = longSeries.length;
  const out = allocSignal(n);
  for (let i = 0; i < n; i += 1) {
    const l = longSeries[i]!;
    const s = shortSeries[i]!;
    if (Number.isNaN(l) && Number.isNaN(s)) continue;
    const isLong = l === 1;
    const isShort = s === 1;
    if (isLong && !isShort) out[i] = LONG;
    else if (isShort && !isLong) out[i] = SHORT;
    else out[i] = FLAT;
  }
  return out;
}
