/**
 * The catalog of signal generators exposed by this SDK — descriptors linking each signal key to its
 * category, required inputs, parameters, outputs, value kind and the feature calculations it
 * consumes. Metadata ONLY (the generation logic lives in the sibling modules); it drives the
 * service's registry / metadata generator, the dependency graph and the researcher-facing Signal
 * Explorer / Debugger.
 */
import type { FeatureKey } from '@platform/feature-calculation-sdk';
import type { SignalValueKind } from './types';

/** The canonical signal generator keys implemented by this SDK. */
export type SignalKey =
  | 'ma_crossover'
  | 'ema_crossover'
  | 'macd_crossover'
  | 'macd_histogram'
  | 'rsi_threshold'
  | 'roc_signal'
  | 'momentum_breakout'
  | 'bollinger_breakout'
  | 'volatility_breakout'
  | 'zscore_reversion'
  | 'volume_confirmation'
  | 'atr_filter'
  | 'trend_filter'
  | 'composite'
  | 'weighted_aggregate'
  | 'confidence';

export type SignalCategory =
  | 'CROSSOVER'
  | 'MOMENTUM'
  | 'MEAN_REVERSION'
  | 'BREAKOUT'
  | 'VOLATILITY'
  | 'VOLUME'
  | 'TREND'
  | 'FILTER'
  | 'COMPOSITE';

/** A required input column for a signal. */
export type SignalInput = 'close' | 'high' | 'low' | 'open' | 'volume';

export interface SignalParam {
  readonly name: string;
  readonly label: string;
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
  /** Whether this parameter must be a positive integer (a lookback window). */
  readonly integer: boolean;
}

export interface SignalDescriptor {
  readonly key: SignalKey;
  readonly label: string;
  readonly category: SignalCategory;
  readonly inputs: readonly SignalInput[];
  readonly params: readonly SignalParam[];
  readonly outputs: readonly string[];
  /** The semantic value kind of the PRIMARY output (drives range validation). */
  readonly valueKind: SignalValueKind;
  readonly streaming: boolean;
  /** The feature calculations this signal consumes (cross-engine lineage → Feature Store). */
  readonly features: readonly FeatureKey[];
  readonly description: string;
}

const WINDOW = (
  name: string,
  label: string,
  defaultValue: number,
  min = 2,
  max = 500,
): SignalParam => ({ name, label, defaultValue, min, max, integer: true });
const LEVEL = (
  name: string,
  label: string,
  defaultValue: number,
  min: number,
  max: number,
): SignalParam => ({ name, label, defaultValue, min, max, integer: false });

export const SIGNAL_CATALOG: readonly SignalDescriptor[] = [
  {
    key: 'ma_crossover',
    label: 'MA Crossover',
    category: 'CROSSOVER',
    inputs: ['close'],
    params: [WINDOW('fast', 'Fast window', 12), WINDOW('slow', 'Slow window', 26, 3)],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: true,
    features: ['sma'],
    description: 'Long when the fast SMA is above the slow SMA, short when below.',
  },
  {
    key: 'ema_crossover',
    label: 'EMA Crossover',
    category: 'CROSSOVER',
    inputs: ['close'],
    params: [WINDOW('fast', 'Fast window', 12), WINDOW('slow', 'Slow window', 26, 3)],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: false,
    features: ['ema'],
    description: 'Fast/slow EMA crossover — reacts faster than the SMA crossover.',
  },
  {
    key: 'macd_crossover',
    label: 'MACD Crossover',
    category: 'CROSSOVER',
    inputs: ['close'],
    params: [
      WINDOW('fast', 'Fast', 12),
      WINDOW('slow', 'Slow', 26, 3),
      WINDOW('signal', 'Signal', 9),
    ],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: false,
    features: ['macd'],
    description: 'Long when the MACD line is above its signal line, short when below.',
  },
  {
    key: 'macd_histogram',
    label: 'MACD Histogram',
    category: 'MOMENTUM',
    inputs: ['close'],
    params: [
      WINDOW('fast', 'Fast', 12),
      WINDOW('slow', 'Slow', 26, 3),
      WINDOW('signal', 'Signal', 9),
    ],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: false,
    features: ['macd'],
    description: 'Sign of the MACD histogram (MACD − signal).',
  },
  {
    key: 'rsi_threshold',
    label: 'RSI Threshold',
    category: 'MOMENTUM',
    inputs: ['close'],
    params: [
      WINDOW('window', 'RSI window', 14),
      LEVEL('lower', 'Oversold', 30, 1, 50),
      LEVEL('upper', 'Overbought', 70, 50, 99),
    ],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: true,
    features: ['rsi'],
    description: 'Long when RSI is oversold (< lower), short when overbought (> upper).',
  },
  {
    key: 'roc_signal',
    label: 'ROC Signal',
    category: 'MOMENTUM',
    inputs: ['close'],
    params: [WINDOW('window', 'Window', 10), LEVEL('threshold', 'Threshold %', 0, 0, 50)],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: false,
    features: ['roc'],
    description: 'Long when rate-of-change exceeds +threshold, short when below −threshold.',
  },
  {
    key: 'momentum_breakout',
    label: 'Momentum Breakout',
    category: 'BREAKOUT',
    inputs: ['close'],
    params: [WINDOW('window', 'Window', 10), LEVEL('threshold', 'Threshold', 0, 0, 1000)],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: false,
    features: ['momentum'],
    description: 'Long/short when windowed momentum breaks beyond ±threshold.',
  },
  {
    key: 'bollinger_breakout',
    label: 'Bollinger Breakout',
    category: 'BREAKOUT',
    inputs: ['close'],
    params: [WINDOW('window', 'Window', 20), LEVEL('k', 'Std devs', 2, 1, 5)],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: false,
    features: ['bollinger_bands'],
    description: 'Long when the close breaks above the upper band, short below the lower band.',
  },
  {
    key: 'volatility_breakout',
    label: 'Volatility Breakout',
    category: 'VOLATILITY',
    inputs: ['high', 'low', 'close'],
    params: [WINDOW('window', 'ATR window', 14), LEVEL('k', 'ATR multiple', 1, 0.25, 10)],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: false,
    features: ['atr'],
    description: 'Directional breakout when the one-bar move exceeds ±k·ATR.',
  },
  {
    key: 'zscore_reversion',
    label: 'Z-Score Reversion',
    category: 'MEAN_REVERSION',
    inputs: ['close'],
    params: [WINDOW('window', 'Window', 20), LEVEL('entry', 'Entry z', 2, 0.5, 5)],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: false,
    features: ['zscore'],
    description: 'Contrarian: long when z < −entry, short when z > +entry.',
  },
  {
    key: 'volume_confirmation',
    label: 'Volume Confirmation',
    category: 'VOLUME',
    inputs: ['volume'],
    params: [WINDOW('window', 'Window', 20), LEVEL('multiplier', 'Multiplier', 1.5, 1, 10)],
    outputs: ['signal'],
    valueKind: 'gate',
    streaming: false,
    features: ['rolling_volume'],
    description: 'Gate: 1 when volume exceeds its rolling average × multiplier, else 0.',
  },
  {
    key: 'atr_filter',
    label: 'ATR Filter',
    category: 'FILTER',
    inputs: ['high', 'low', 'close'],
    params: [WINDOW('window', 'ATR window', 14), LEVEL('minPct', 'Min ATR %', 0.005, 0, 0.5)],
    outputs: ['signal'],
    valueKind: 'gate',
    streaming: false,
    features: ['atr'],
    description: 'Gate: 1 when normalized ATR (ATR/close) is at least minPct (tradeable regime).',
  },
  {
    key: 'trend_filter',
    label: 'Trend Filter',
    category: 'TREND',
    inputs: ['close'],
    params: [WINDOW('window', 'Window', 50)],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: false,
    features: ['sma'],
    description: 'Directional regime: long above the SMA, short below.',
  },
  {
    key: 'composite',
    label: 'Composite (rule engine)',
    category: 'COMPOSITE',
    inputs: ['close', 'volume'],
    params: [
      WINDOW('fast', 'Fast', 12),
      WINDOW('slow', 'Slow', 26, 3),
      WINDOW('trend', 'Trend', 50),
    ],
    outputs: ['signal'],
    valueKind: 'direction',
    streaming: false,
    features: ['sma', 'rolling_volume'],
    description: 'Trend- and volume-confirmed MA crossover, expressed through the rule engine.',
  },
  {
    key: 'weighted_aggregate',
    label: 'Weighted Aggregate',
    category: 'COMPOSITE',
    inputs: ['close'],
    params: [LEVEL('threshold', 'Vote threshold', 0.5, 0, 1)],
    outputs: ['signal', 'score', 'confidence'],
    valueKind: 'direction',
    streaming: false,
    features: ['sma', 'macd', 'rsi'],
    description: 'Weighted vote across MA-crossover, MACD-crossover and RSI-threshold sub-signals.',
  },
  {
    key: 'confidence',
    label: 'Signal Confidence',
    category: 'COMPOSITE',
    inputs: ['close'],
    params: [LEVEL('threshold', 'Vote threshold', 0.5, 0, 1)],
    outputs: ['confidence', 'signal'],
    valueKind: 'unit',
    streaming: false,
    features: ['sma', 'macd', 'rsi'],
    description: 'Sub-signal agreement confidence in [0, 1] for the weighted aggregate.',
  },
];

export function describeSignal(key: SignalKey): SignalDescriptor | undefined {
  return SIGNAL_CATALOG.find((signal) => signal.key === key);
}

export function signalsInCategory(category: SignalCategory): readonly SignalDescriptor[] {
  return SIGNAL_CATALOG.filter((signal) => signal.category === category);
}
