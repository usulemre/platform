/**
 * A runner that binds each catalog signal key to its REAL generator in
 * `@platform/signal-calculation-sdk`, returning the primary output series, and exposes the internal
 * component/operand series for the Signal Debugger. The signal generation and the feature
 * computations it uses are the real SDK ones — no calculation is mocked. Pure functions, no IO.
 */
import {
  atr,
  bollingerBands,
  ema,
  macd,
  momentum,
  rateOfChange,
  rsi,
  sma,
  zScore,
  type FeatureKey,
} from '@platform/feature-calculation-sdk';
import {
  atrFilter,
  bollingerBreakout,
  compositeSignal,
  describeSignal,
  emaCrossover,
  maCrossover,
  macdCrossover,
  macdHistogramSignal,
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
} from '@platform/signal-calculation-sdk';

export type SignalParams = Readonly<Record<string, number>>;

/** Resolve a numeric parameter, falling back to the catalog default. */
function param(signalKey: SignalKey, params: SignalParams, name: string): number {
  const provided = params[name];
  if (provided !== undefined) return provided;
  const definition = describeSignal(signalKey)?.params.find((p) => p.name === name);
  return definition?.defaultValue ?? 0;
}

/** Merge catalog defaults with the provided params to get the effective params. */
export function resolveParams(signalKey: SignalKey, params?: SignalParams): SignalParams {
  const resolved: Record<string, number> = {};
  for (const definition of describeSignal(signalKey)?.params ?? [])
    resolved[definition.name] = definition.defaultValue;
  if (params) for (const [name, value] of Object.entries(params)) resolved[name] = value;
  return resolved;
}

function subSignals(series: OhlcvSeries) {
  return [
    { signal: maCrossover(series.close), weight: 1 },
    { signal: macdCrossover(series.close), weight: 1 },
    { signal: rsiThresholdSignal(series.close), weight: 1 },
  ];
}

/** Compute the primary output series for a signal (the real SDK generator). */
export function runSignal(
  signalKey: SignalKey,
  series: OhlcvSeries,
  params: SignalParams,
): Float64Array {
  const p = (name: string) => param(signalKey, params, name);
  switch (signalKey) {
    case 'ma_crossover':
      return maCrossover(series.close, p('fast'), p('slow'));
    case 'ema_crossover':
      return emaCrossover(series.close, p('fast'), p('slow'));
    case 'macd_crossover':
      return macdCrossover(series.close, p('fast'), p('slow'), p('signal'));
    case 'macd_histogram':
      return macdHistogramSignal(series.close, p('fast'), p('slow'), p('signal'));
    case 'rsi_threshold':
      return rsiThresholdSignal(series.close, p('window'), p('lower'), p('upper'));
    case 'roc_signal':
      return rocSignal(series.close, p('window'), p('threshold'));
    case 'momentum_breakout':
      return momentumBreakout(series.close, p('window'), p('threshold'));
    case 'bollinger_breakout':
      return bollingerBreakout(series.close, p('window'), p('k'));
    case 'volatility_breakout':
      return volatilityBreakout(series.high, series.low, series.close, p('window'), p('k'));
    case 'zscore_reversion':
      return zScoreReversion(series.close, p('window'), p('entry'));
    case 'volume_confirmation':
      return volumeConfirmation(series.volume, p('window'), p('multiplier'));
    case 'atr_filter':
      return atrFilter(series.high, series.low, series.close, p('window'), p('minPct'));
    case 'trend_filter':
      return trendFilter(series.close, p('window'));
    case 'composite':
      return compositeSignal(series, { fast: p('fast'), slow: p('slow'), trend: p('trend') });
    case 'weighted_aggregate':
      return weightedAggregate(subSignals(series), p('threshold')).signal;
    case 'confidence':
      return weightedAggregate(subSignals(series), p('threshold')).confidence;
    default:
      throw new RangeError(`no runner for signal '${signalKey}'`);
  }
}

/**
 * Compute the internal operand series that produce a signal — the real feature/indicator values
 * used at each bar. Powers the Signal Debugger's per-bar breakdown. Deterministic and causal.
 */
export function signalComponents(
  signalKey: SignalKey,
  series: OhlcvSeries,
  params: SignalParams,
): Record<string, Float64Array> {
  const p = (name: string) => param(signalKey, params, name);
  switch (signalKey) {
    case 'ma_crossover':
      return { fastMA: sma(series.close, p('fast')), slowMA: sma(series.close, p('slow')) };
    case 'ema_crossover':
      return { fastEMA: ema(series.close, p('fast')), slowEMA: ema(series.close, p('slow')) };
    case 'macd_crossover':
    case 'macd_histogram': {
      const m = macd(series.close, p('fast'), p('slow'), p('signal'));
      return { macd: m.macd, signal: m.signal, histogram: m.histogram };
    }
    case 'rsi_threshold':
      return { rsi: rsi(series.close, p('window')) };
    case 'roc_signal':
      return { roc: rateOfChange(series.close, p('window')) };
    case 'momentum_breakout':
      return { momentum: momentum(series.close, p('window')) };
    case 'bollinger_breakout': {
      const bb = bollingerBands(series.close, p('window'), p('k'));
      return { close: series.close, upper: bb.upper, lower: bb.lower };
    }
    case 'volatility_breakout':
      return { close: series.close, atr: atr(series.high, series.low, series.close, p('window')) };
    case 'zscore_reversion':
      return { zscore: zScore(series.close, p('window')) };
    case 'volume_confirmation':
      return { volume: series.volume, avgVolume: sma(series.volume, p('window')) };
    case 'atr_filter':
      return { close: series.close, atr: atr(series.high, series.low, series.close, p('window')) };
    case 'trend_filter':
      return { close: series.close, sma: sma(series.close, p('window')) };
    case 'composite':
      return {
        cross: maCrossover(series.close, p('fast'), p('slow')),
        trend: trendFilter(series.close, p('trend')),
        volume: volumeConfirmation(series.volume),
      };
    case 'weighted_aggregate':
    case 'confidence': {
      const subs = subSignals(series);
      const agg = weightedAggregate(subs, p('threshold'));
      return {
        ma_crossover: subs[0]!.signal,
        macd_crossover: subs[1]!.signal,
        rsi_threshold: subs[2]!.signal,
        score: agg.score,
      };
    }
    default:
      return {};
  }
}

/** Conceptual signal→signal dependencies for the dependency-graph view (mirrors the service graph). */
export const SIGNAL_DEPENDENCIES: Partial<Record<SignalKey, readonly SignalKey[]>> = {
  composite: ['ma_crossover', 'trend_filter', 'volume_confirmation'],
  weighted_aggregate: ['ma_crossover', 'macd_crossover', 'rsi_threshold'],
  confidence: ['ma_crossover', 'macd_crossover', 'rsi_threshold'],
};

/** The feature calculations a signal consumes (from the catalog). */
export function featuresOf(signalKey: SignalKey): readonly FeatureKey[] {
  return describeSignal(signalKey)?.features ?? [];
}
