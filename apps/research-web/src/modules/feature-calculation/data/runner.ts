/**
 * A compact runner that binds each catalog feature key to its REAL calculation in
 * `@platform/feature-calculation-sdk`, returning the primary output series. Used by the module's
 * mock repository to produce genuine results for the researcher UI (Calculation Explorer,
 * benchmark, previews). Deterministic and causal — the calculations are the real SDK ones; no
 * calculation is mocked. Pure functions, no IO.
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

export type FeatureParams = Readonly<Record<string, number>>;

/** Resolve a numeric parameter, falling back to the catalog default. */
function param(featureKey: FeatureKey, params: FeatureParams, name: string): number {
  const provided = params[name];
  if (provided !== undefined) return provided;
  const definition = describeFeature(featureKey)?.params.find((p) => p.name === name);
  return definition?.defaultValue ?? 0;
}

/** Merge catalog defaults with the provided params to get the effective params. */
export function resolveParams(featureKey: FeatureKey, params?: FeatureParams): FeatureParams {
  const resolved: Record<string, number> = {};
  for (const definition of describeFeature(featureKey)?.params ?? [])
    resolved[definition.name] = definition.defaultValue;
  if (params) for (const [name, value] of Object.entries(params)) resolved[name] = value;
  return resolved;
}

/** Compute the primary output series for a feature (the real SDK calculation). */
export function runFeature(
  featureKey: FeatureKey,
  series: OhlcvSeries,
  params: FeatureParams,
): Float64Array {
  const p = (name: string) => param(featureKey, params, name);
  switch (featureKey) {
    case 'sma':
      return sma(series.close, p('window'));
    case 'ema':
      return ema(series.close, p('window'));
    case 'wma':
      return wma(series.close, p('window'));
    case 'rolling_mean':
      return rollingMean(series.close, p('window'));
    case 'rolling_median':
      return rollingMedian(series.close, p('window'));
    case 'rolling_std':
      return rollingStd(series.close, p('window'));
    case 'rolling_variance':
      return rollingVariance(series.close, p('window'));
    case 'zscore':
      return zScore(series.close, p('window'));
    case 'roc':
      return rateOfChange(series.close, p('window'));
    case 'momentum':
      return momentum(series.close, p('window'));
    case 'log_returns':
      return logReturns(series.close);
    case 'arithmetic_returns':
      return arithmeticReturns(series.close);
    case 'rolling_max':
      return rollingMax(series.close, p('window'));
    case 'rolling_min':
      return rollingMin(series.close, p('window'));
    case 'true_range':
      return trueRange(series.high, series.low, series.close);
    case 'atr':
      return atr(series.high, series.low, series.close, p('window'));
    case 'rsi':
      return rsi(series.close, p('window'));
    case 'macd':
      return macd(series.close, p('fast'), p('slow'), p('signal')).macd;
    case 'bollinger_bands':
      return bollingerBands(series.close, p('window'), p('k')).middle;
    case 'vwap':
      return vwap(series.high, series.low, series.close, series.volume);
    case 'rolling_volume':
      return rollingVolume(series.volume, p('window'));
    case 'dollar_volume':
      return dollarVolume(series.close, series.volume);
    default:
      throw new RangeError(`no runner for feature '${featureKey}'`);
  }
}

/** Conceptual dependencies for the dependency-graph view (mirrors the service graph). */
export const FEATURE_DEPENDENCIES: Partial<Record<FeatureKey, readonly FeatureKey[]>> = {
  rolling_std: ['rolling_variance'],
  zscore: ['rolling_mean', 'rolling_std'],
  bollinger_bands: ['sma', 'rolling_std'],
  macd: ['ema'],
  atr: ['true_range'],
};
