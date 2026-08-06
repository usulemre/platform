/**
 * Composite signals & aggregation — the layer that combines several base signals into one.
 *
 *  - **Weighted Signal Aggregation** (`weightedAggregate`): a weighted vote across directional
 *    sub-signals, thresholded into a net direction, with a continuous score and a confidence.
 *  - **Signal Confidence Scoring** (`confidenceScore`): the agreement of sub-signals with the net
 *    direction, in `[0, 1]`.
 *  - **Multi-Feature Composite** (`compositeSignal`): a trend- and volume-confirmed crossover
 *    expressed through the Rule Engine.
 *
 * All causal, deterministic and NaN-aware — each output at index `i` uses only sub-signal values at
 * `i` (which are themselves causal).
 */
import { type NumberSeries, type OhlcvSeries } from '@platform/feature-calculation-sdk';
import { maCrossover } from './crossovers';
import { trendFilter, volumeConfirmation } from './filters';
import { ruleSignal, type Bindings, type SignalRules } from './rule-engine';
import { allocSignal, FLAT, LONG, sign, SHORT } from './types';

/** A directional sub-signal with its aggregation weight. */
export interface WeightedSignal {
  readonly signal: NumberSeries;
  readonly weight: number;
}

/** The result of a weighted aggregation: the net signal, its normalized score and confidence. */
export interface AggregateResult {
  /** The thresholded net direction in `{ -1, 0, 1 }`. */
  readonly signal: Float64Array;
  /** The weighted, normalized net score in `[-1, 1]`. */
  readonly score: Float64Array;
  /** Agreement of sub-signals with the net direction in `[0, 1]`. */
  readonly confidence: Float64Array;
}

/**
 * Per-index confidence in `[0, 1]`: the weight of sub-signals agreeing with the net direction over
 * the total finite weight. `NaN` when no sub-signal is finite at `i`; `0` when the net is flat.
 */
export function confidenceScore(signals: readonly WeightedSignal[]): Float64Array {
  const n = signals.length > 0 ? signals[0]!.signal.length : 0;
  const out = allocSignal(n);
  for (let i = 0; i < n; i += 1) {
    let net = 0;
    let totalWeight = 0;
    let finite = 0;
    for (const { signal, weight } of signals) {
      const v = signal[i]!;
      if (!Number.isFinite(v)) continue;
      finite += 1;
      net += weight * v;
      totalWeight += Math.abs(weight);
    }
    if (finite === 0 || totalWeight === 0) continue;
    const dir = sign(net);
    if (dir === FLAT) {
      out[i] = 0;
      continue;
    }
    let agree = 0;
    for (const { signal, weight } of signals) {
      const v = signal[i]!;
      if (!Number.isFinite(v)) continue;
      if (sign(v) === dir) agree += Math.abs(weight);
    }
    out[i] = agree / totalWeight;
  }
  return out;
}

/**
 * Weighted Signal Aggregation. `score[i] = Σ wₖ·sₖ / Σ|wₖ|` over the finite sub-signals (a vote in
 * `[-1, 1]`); `signal[i] = sign(score)` when `|score| ≥ threshold`, else `FLAT`; `confidence` is the
 * agreement of the sub-signals with the net direction. `NaN` where no sub-signal is finite.
 * Default threshold 0.5.
 */
export function weightedAggregate(
  signals: readonly WeightedSignal[],
  threshold = 0.5,
): AggregateResult {
  if (threshold < 0 || threshold > 1)
    throw new RangeError(`threshold must be in [0, 1], received ${threshold}`);
  const n = signals.length > 0 ? signals[0]!.signal.length : 0;
  for (const { signal } of signals)
    if (signal.length !== n) throw new RangeError('sub-signal length mismatch');
  const signalOut = allocSignal(n);
  const scoreOut = allocSignal(n);
  for (let i = 0; i < n; i += 1) {
    let net = 0;
    let totalWeight = 0;
    let finite = 0;
    for (const { signal, weight } of signals) {
      const v = signal[i]!;
      if (!Number.isFinite(v)) continue;
      finite += 1;
      net += weight * v;
      totalWeight += Math.abs(weight);
    }
    if (finite === 0 || totalWeight === 0) continue;
    const score = net / totalWeight;
    scoreOut[i] = score;
    signalOut[i] = Math.abs(score) >= threshold ? sign(score) : FLAT;
  }
  return { signal: signalOut, score: scoreOut, confidence: confidenceScore(signals) };
}

/** Parameters for the canonical multi-feature composite signal. */
export interface CompositeParams {
  readonly fast?: number;
  readonly slow?: number;
  readonly trend?: number;
  readonly volumeWindow?: number;
  readonly volumeMultiplier?: number;
}

/**
 * Multi-Feature Composite signal, expressed through the Rule Engine: go `LONG` when the MA
 * crossover is up **and** the trend filter is up **and** volume confirms; go `SHORT` when the
 * crossover is down **and** the trend is down **and** volume confirms; else `FLAT`. Demonstrates
 * composing several real features into one governed, declarative signal.
 */
export function compositeSignal(series: OhlcvSeries, params: CompositeParams = {}): Float64Array {
  const fast = params.fast ?? 12;
  const slow = params.slow ?? 26;
  const trendWindow = params.trend ?? 50;
  const volumeWindow = params.volumeWindow ?? 20;
  const volumeMultiplier = params.volumeMultiplier ?? 1.5;

  const bindings: Bindings = {
    cross: maCrossover(series.close, fast, slow),
    trend: trendFilter(series.close, trendWindow),
    volume: volumeConfirmation(series.volume, volumeWindow, volumeMultiplier),
  };

  const rules: SignalRules = {
    long: {
      combine: 'all',
      rules: [
        { left: 'cross', op: 'gte', right: LONG },
        { left: 'trend', op: 'gte', right: LONG },
        { left: 'volume', op: 'gte', right: 1 },
      ],
    },
    short: {
      combine: 'all',
      rules: [
        { left: 'cross', op: 'lte', right: SHORT },
        { left: 'trend', op: 'lte', right: SHORT },
        { left: 'volume', op: 'gte', right: 1 },
      ],
    },
  };
  return ruleSignal(rules, bindings);
}
