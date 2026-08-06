/**
 * The catalog of feature calculations exposed by this SDK — descriptors linking each feature
 * key to its category, required inputs, parameters and outputs. This is metadata ONLY (the
 * calculations themselves live in the sibling modules); it drives the service's registry /
 * metadata generator and the researcher-facing Calculation Explorer.
 */

/** The canonical feature calculation keys implemented by this SDK. */
export type FeatureKey =
  | 'sma'
  | 'ema'
  | 'wma'
  | 'rolling_mean'
  | 'rolling_median'
  | 'rolling_std'
  | 'rolling_variance'
  | 'zscore'
  | 'roc'
  | 'momentum'
  | 'log_returns'
  | 'arithmetic_returns'
  | 'rolling_max'
  | 'rolling_min'
  | 'true_range'
  | 'atr'
  | 'rsi'
  | 'macd'
  | 'bollinger_bands'
  | 'vwap'
  | 'rolling_volume'
  | 'dollar_volume';

export type FeatureCategory =
  | 'TREND'
  | 'MOMENTUM'
  | 'VOLATILITY'
  | 'VOLUME'
  | 'RETURNS'
  | 'STATISTICS';

/** A required input column for a calculation. */
export type FeatureInput = 'close' | 'high' | 'low' | 'open' | 'volume';

export interface FeatureParam {
  readonly name: string;
  readonly label: string;
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
}

export interface FeatureDescriptor {
  readonly key: FeatureKey;
  readonly label: string;
  readonly category: FeatureCategory;
  readonly inputs: readonly FeatureInput[];
  readonly params: readonly FeatureParam[];
  readonly outputs: readonly string[];
  readonly streaming: boolean;
  readonly description: string;
}

const WINDOW = (defaultValue: number, min = 2, max = 500): FeatureParam => ({
  name: 'window',
  label: 'Lookback window',
  defaultValue,
  min,
  max,
});

export const FEATURE_CATALOG: readonly FeatureDescriptor[] = [
  {
    key: 'sma',
    label: 'Simple Moving Average',
    category: 'TREND',
    inputs: ['close'],
    params: [WINDOW(20)],
    outputs: ['sma'],
    streaming: true,
    description: 'Arithmetic mean over the lookback window.',
  },
  {
    key: 'ema',
    label: 'Exponential Moving Average',
    category: 'TREND',
    inputs: ['close'],
    params: [WINDOW(20)],
    outputs: ['ema'],
    streaming: true,
    description: 'SMA-seeded exponential average with alpha = 2/(window+1).',
  },
  {
    key: 'wma',
    label: 'Weighted Moving Average',
    category: 'TREND',
    inputs: ['close'],
    params: [WINDOW(20)],
    outputs: ['wma'],
    streaming: false,
    description: 'Linearly weighted average favouring recent values.',
  },
  {
    key: 'rolling_mean',
    label: 'Rolling Mean',
    category: 'STATISTICS',
    inputs: ['close'],
    params: [WINDOW(20)],
    outputs: ['rolling_mean'],
    streaming: true,
    description: 'Rolling arithmetic mean.',
  },
  {
    key: 'rolling_median',
    label: 'Rolling Median',
    category: 'STATISTICS',
    inputs: ['close'],
    params: [WINDOW(20)],
    outputs: ['rolling_median'],
    streaming: false,
    description: 'Rolling median over the window.',
  },
  {
    key: 'rolling_std',
    label: 'Rolling Std Dev',
    category: 'STATISTICS',
    inputs: ['close'],
    params: [WINDOW(20)],
    outputs: ['rolling_std'],
    streaming: true,
    description: 'Rolling sample standard deviation.',
  },
  {
    key: 'rolling_variance',
    label: 'Rolling Variance',
    category: 'STATISTICS',
    inputs: ['close'],
    params: [WINDOW(20)],
    outputs: ['rolling_variance'],
    streaming: false,
    description: 'Rolling sample variance.',
  },
  {
    key: 'zscore',
    label: 'Rolling Z-Score',
    category: 'STATISTICS',
    inputs: ['close'],
    params: [WINDOW(20)],
    outputs: ['zscore'],
    streaming: false,
    description: 'Standardized deviation from the rolling mean.',
  },
  {
    key: 'roc',
    label: 'Rate of Change',
    category: 'MOMENTUM',
    inputs: ['close'],
    params: [WINDOW(10)],
    outputs: ['roc'],
    streaming: false,
    description: 'Percent change over the window.',
  },
  {
    key: 'momentum',
    label: 'Momentum',
    category: 'MOMENTUM',
    inputs: ['close'],
    params: [WINDOW(10)],
    outputs: ['momentum'],
    streaming: false,
    description: 'Absolute change over the window.',
  },
  {
    key: 'log_returns',
    label: 'Log Returns',
    category: 'RETURNS',
    inputs: ['close'],
    params: [],
    outputs: ['log_returns'],
    streaming: false,
    description: 'Continuously compounded returns.',
  },
  {
    key: 'arithmetic_returns',
    label: 'Arithmetic Returns',
    category: 'RETURNS',
    inputs: ['close'],
    params: [],
    outputs: ['arithmetic_returns'],
    streaming: false,
    description: 'Simple period-over-period returns.',
  },
  {
    key: 'rolling_max',
    label: 'Rolling Maximum',
    category: 'STATISTICS',
    inputs: ['close'],
    params: [WINDOW(20)],
    outputs: ['rolling_max'],
    streaming: true,
    description: 'Rolling window maximum.',
  },
  {
    key: 'rolling_min',
    label: 'Rolling Minimum',
    category: 'STATISTICS',
    inputs: ['close'],
    params: [WINDOW(20)],
    outputs: ['rolling_min'],
    streaming: true,
    description: 'Rolling window minimum.',
  },
  {
    key: 'true_range',
    label: 'True Range',
    category: 'VOLATILITY',
    inputs: ['high', 'low', 'close'],
    params: [],
    outputs: ['true_range'],
    streaming: false,
    description: 'Greatest of the current range and gaps to the prior close.',
  },
  {
    key: 'atr',
    label: 'Average True Range',
    category: 'VOLATILITY',
    inputs: ['high', 'low', 'close'],
    params: [WINDOW(14)],
    outputs: ['atr'],
    streaming: false,
    description: 'Wilder-smoothed true range.',
  },
  {
    key: 'rsi',
    label: 'Relative Strength Index',
    category: 'MOMENTUM',
    inputs: ['close'],
    params: [WINDOW(14)],
    outputs: ['rsi'],
    streaming: true,
    description: 'Wilder RSI momentum oscillator (0–100).',
  },
  {
    key: 'macd',
    label: 'MACD',
    category: 'MOMENTUM',
    inputs: ['close'],
    params: [
      { name: 'fast', label: 'Fast', defaultValue: 12, min: 2, max: 200 },
      { name: 'slow', label: 'Slow', defaultValue: 26, min: 3, max: 400 },
      { name: 'signal', label: 'Signal', defaultValue: 9, min: 2, max: 200 },
    ],
    outputs: ['macd', 'signal', 'histogram'],
    streaming: false,
    description: 'EMA(fast) − EMA(slow) with a signal line and histogram.',
  },
  {
    key: 'bollinger_bands',
    label: 'Bollinger Bands',
    category: 'VOLATILITY',
    inputs: ['close'],
    params: [WINDOW(20), { name: 'k', label: 'Std devs', defaultValue: 2, min: 1, max: 5 }],
    outputs: ['middle', 'upper', 'lower'],
    streaming: false,
    description: 'SMA envelope ± k population std deviations.',
  },
  {
    key: 'vwap',
    label: 'VWAP',
    category: 'VOLUME',
    inputs: ['high', 'low', 'close', 'volume'],
    params: [],
    outputs: ['vwap'],
    streaming: false,
    description: 'Cumulative volume-weighted average price.',
  },
  {
    key: 'rolling_volume',
    label: 'Rolling Volume',
    category: 'VOLUME',
    inputs: ['volume'],
    params: [WINDOW(20)],
    outputs: ['rolling_volume'],
    streaming: true,
    description: 'Rolling total traded volume.',
  },
  {
    key: 'dollar_volume',
    label: 'Dollar Volume',
    category: 'VOLUME',
    inputs: ['close', 'volume'],
    params: [],
    outputs: ['dollar_volume'],
    streaming: false,
    description: 'Per-bar notional (price × volume).',
  },
];

export function describeFeature(key: FeatureKey): FeatureDescriptor | undefined {
  return FEATURE_CATALOG.find((feature) => feature.key === key);
}

export function featuresInCategory(category: FeatureCategory): readonly FeatureDescriptor[] {
  return FEATURE_CATALOG.filter((feature) => feature.category === category);
}
