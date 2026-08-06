/**
 * Feature executors — the uniform interface that binds each catalog feature key to its REAL
 * calculation in `@platform/feature-calculation-sdk`. Executors are pure, deterministic and
 * causal: they read the requested typed columns from the dataset, apply the calculation with the
 * resolved parameters, and return one or more named output series. No IO, no mutation of inputs.
 */
import {
  arithmeticReturns,
  atr,
  bollingerBands,
  describeFeature,
  dollarVolume,
  ema,
  logReturns,
  macd,
  momentum,
  rateOfChange,
  rollingMax,
  rollingMean,
  rollingMedian,
  rollingMin,
  rollingStd,
  rollingVariance,
  rollingVolume,
  rsi,
  sma,
  trueRange,
  vwap,
  wma,
  zScore,
  type FeatureKey,
  type OhlcvSeries,
} from '@platform/feature-calculation-sdk';
import type { FeatureOutput, FeatureParams } from './models';

export type FeatureExecutor = (series: OhlcvSeries, params: FeatureParams) => FeatureOutput;

/** Resolve a numeric parameter, falling back to the catalog default. */
function param(featureKey: FeatureKey, params: FeatureParams, name: string): number {
  const provided = params[name];
  if (provided !== undefined) return provided;
  const descriptor = describeFeature(featureKey);
  const definition = descriptor?.params.find((p) => p.name === name);
  if (!definition) throw new RangeError(`unknown parameter '${name}' for feature '${featureKey}'`);
  return definition.defaultValue;
}

function single(primaryKey: string, values: Float64Array): FeatureOutput {
  return { length: values.length, primaryKey, outputs: { [primaryKey]: values } };
}

const EXECUTORS: Record<FeatureKey, FeatureExecutor> = {
  sma: (s, p) => single('sma', sma(s.close, param('sma', p, 'window'))),
  ema: (s, p) => single('ema', ema(s.close, param('ema', p, 'window'))),
  wma: (s, p) => single('wma', wma(s.close, param('wma', p, 'window'))),
  rolling_mean: (s, p) =>
    single('rolling_mean', rollingMean(s.close, param('rolling_mean', p, 'window'))),
  rolling_median: (s, p) =>
    single('rolling_median', rollingMedian(s.close, param('rolling_median', p, 'window'))),
  rolling_std: (s, p) =>
    single('rolling_std', rollingStd(s.close, param('rolling_std', p, 'window'))),
  rolling_variance: (s, p) =>
    single('rolling_variance', rollingVariance(s.close, param('rolling_variance', p, 'window'))),
  zscore: (s, p) => single('zscore', zScore(s.close, param('zscore', p, 'window'))),
  roc: (s, p) => single('roc', rateOfChange(s.close, param('roc', p, 'window'))),
  momentum: (s, p) => single('momentum', momentum(s.close, param('momentum', p, 'window'))),
  log_returns: (s) => single('log_returns', logReturns(s.close)),
  arithmetic_returns: (s) => single('arithmetic_returns', arithmeticReturns(s.close)),
  rolling_max: (s, p) =>
    single('rolling_max', rollingMax(s.close, param('rolling_max', p, 'window'))),
  rolling_min: (s, p) =>
    single('rolling_min', rollingMin(s.close, param('rolling_min', p, 'window'))),
  true_range: (s) => single('true_range', trueRange(s.high, s.low, s.close)),
  atr: (s, p) => single('atr', atr(s.high, s.low, s.close, param('atr', p, 'window'))),
  rsi: (s, p) => single('rsi', rsi(s.close, param('rsi', p, 'window'))),
  macd: (s, p) => {
    const result = macd(
      s.close,
      param('macd', p, 'fast'),
      param('macd', p, 'slow'),
      param('macd', p, 'signal'),
    );
    return {
      length: result.macd.length,
      primaryKey: 'macd',
      outputs: { macd: result.macd, signal: result.signal, histogram: result.histogram },
    };
  },
  bollinger_bands: (s, p) => {
    const result = bollingerBands(
      s.close,
      param('bollinger_bands', p, 'window'),
      param('bollinger_bands', p, 'k'),
    );
    return {
      length: result.middle.length,
      primaryKey: 'middle',
      outputs: { middle: result.middle, upper: result.upper, lower: result.lower },
    };
  },
  vwap: (s) => single('vwap', vwap(s.high, s.low, s.close, s.volume)),
  rolling_volume: (s, p) =>
    single('rolling_volume', rollingVolume(s.volume, param('rolling_volume', p, 'window'))),
  dollar_volume: (s) => single('dollar_volume', dollarVolume(s.close, s.volume)),
};

/** Look up the executor for a feature key. */
export function getExecutor(featureKey: FeatureKey): FeatureExecutor {
  const executor = EXECUTORS[featureKey];
  if (!executor) throw new RangeError(`no executor registered for feature '${featureKey}'`);
  return executor;
}

/** Every feature key that has a registered executor. */
export function executableFeatures(): readonly FeatureKey[] {
  return Object.keys(EXECUTORS) as FeatureKey[];
}
