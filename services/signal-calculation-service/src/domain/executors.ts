/**
 * Signal executors — the uniform interface that binds each catalog signal key to its REAL
 * generator in `@platform/signal-calculation-sdk` (which in turn derives its features from
 * `@platform/feature-calculation-sdk`). Executors are pure, deterministic and causal: they read the
 * requested typed columns from the dataset, apply the generator with the resolved parameters, and
 * return one or more named output series. No IO, no mutation of inputs.
 */
import {
  atrFilter,
  bollingerBreakout,
  compositeSignal,
  describeSignal,
  emaCrossover,
  macdCrossover,
  macdHistogramSignal,
  maCrossover,
  momentumBreakout,
  rocSignal,
  rsiThresholdSignal,
  trendFilter,
  volatilityBreakout,
  volumeConfirmation,
  weightedAggregate,
  zScoreReversion,
  type OhlcvSeries,
  type SignalKey,
  type WeightedSignal,
} from '@platform/signal-calculation-sdk';
import type { SignalOutput, SignalParams } from './models';

export type SignalExecutor = (series: OhlcvSeries, params: SignalParams) => SignalOutput;

/** Resolve a numeric parameter, falling back to the catalog default. */
function param(signalKey: SignalKey, params: SignalParams, name: string): number {
  const provided = params[name];
  if (provided !== undefined) return provided;
  const descriptor = describeSignal(signalKey);
  const definition = descriptor?.params.find((p) => p.name === name);
  if (!definition) throw new RangeError(`unknown parameter '${name}' for signal '${signalKey}'`);
  return definition.defaultValue;
}

function single(primaryKey: string, values: Float64Array): SignalOutput {
  return { length: values.length, primaryKey, outputs: { [primaryKey]: values } };
}

/** The canonical sub-signals used by the composite aggregation / confidence signals. */
function defaultSubSignals(series: OhlcvSeries): WeightedSignal[] {
  return [
    { signal: maCrossover(series.close), weight: 1 },
    { signal: macdCrossover(series.close), weight: 1 },
    { signal: rsiThresholdSignal(series.close), weight: 1 },
  ];
}

const EXECUTORS: Record<SignalKey, SignalExecutor> = {
  ma_crossover: (s, p) =>
    single(
      'signal',
      maCrossover(s.close, param('ma_crossover', p, 'fast'), param('ma_crossover', p, 'slow')),
    ),
  ema_crossover: (s, p) =>
    single(
      'signal',
      emaCrossover(s.close, param('ema_crossover', p, 'fast'), param('ema_crossover', p, 'slow')),
    ),
  macd_crossover: (s, p) =>
    single(
      'signal',
      macdCrossover(
        s.close,
        param('macd_crossover', p, 'fast'),
        param('macd_crossover', p, 'slow'),
        param('macd_crossover', p, 'signal'),
      ),
    ),
  macd_histogram: (s, p) =>
    single(
      'signal',
      macdHistogramSignal(
        s.close,
        param('macd_histogram', p, 'fast'),
        param('macd_histogram', p, 'slow'),
        param('macd_histogram', p, 'signal'),
      ),
    ),
  rsi_threshold: (s, p) =>
    single(
      'signal',
      rsiThresholdSignal(
        s.close,
        param('rsi_threshold', p, 'window'),
        param('rsi_threshold', p, 'lower'),
        param('rsi_threshold', p, 'upper'),
      ),
    ),
  roc_signal: (s, p) =>
    single(
      'signal',
      rocSignal(s.close, param('roc_signal', p, 'window'), param('roc_signal', p, 'threshold')),
    ),
  momentum_breakout: (s, p) =>
    single(
      'signal',
      momentumBreakout(
        s.close,
        param('momentum_breakout', p, 'window'),
        param('momentum_breakout', p, 'threshold'),
      ),
    ),
  bollinger_breakout: (s, p) =>
    single(
      'signal',
      bollingerBreakout(
        s.close,
        param('bollinger_breakout', p, 'window'),
        param('bollinger_breakout', p, 'k'),
      ),
    ),
  volatility_breakout: (s, p) =>
    single(
      'signal',
      volatilityBreakout(
        s.high,
        s.low,
        s.close,
        param('volatility_breakout', p, 'window'),
        param('volatility_breakout', p, 'k'),
      ),
    ),
  zscore_reversion: (s, p) =>
    single(
      'signal',
      zScoreReversion(
        s.close,
        param('zscore_reversion', p, 'window'),
        param('zscore_reversion', p, 'entry'),
      ),
    ),
  volume_confirmation: (s, p) =>
    single(
      'signal',
      volumeConfirmation(
        s.volume,
        param('volume_confirmation', p, 'window'),
        param('volume_confirmation', p, 'multiplier'),
      ),
    ),
  atr_filter: (s, p) =>
    single(
      'signal',
      atrFilter(
        s.high,
        s.low,
        s.close,
        param('atr_filter', p, 'window'),
        param('atr_filter', p, 'minPct'),
      ),
    ),
  trend_filter: (s, p) =>
    single('signal', trendFilter(s.close, param('trend_filter', p, 'window'))),
  composite: (s, p) =>
    single(
      'signal',
      compositeSignal(s, {
        fast: param('composite', p, 'fast'),
        slow: param('composite', p, 'slow'),
        trend: param('composite', p, 'trend'),
      }),
    ),
  weighted_aggregate: (s, p) => {
    const result = weightedAggregate(
      defaultSubSignals(s),
      param('weighted_aggregate', p, 'threshold'),
    );
    return {
      length: result.signal.length,
      primaryKey: 'signal',
      outputs: { signal: result.signal, score: result.score, confidence: result.confidence },
    };
  },
  confidence: (s, p) => {
    const result = weightedAggregate(defaultSubSignals(s), param('confidence', p, 'threshold'));
    return {
      length: result.confidence.length,
      primaryKey: 'confidence',
      outputs: { confidence: result.confidence, signal: result.signal },
    };
  },
};

/** Look up the executor for a signal key. */
export function getExecutor(signalKey: SignalKey): SignalExecutor {
  const executor = EXECUTORS[signalKey];
  if (!executor) throw new RangeError(`no executor registered for signal '${signalKey}'`);
  return executor;
}

/** Every signal key that has a registered executor. */
export function executableSignals(): readonly SignalKey[] {
  return Object.keys(EXECUTORS) as SignalKey[];
}
