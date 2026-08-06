/**
 * Canonical market-data-type catalog — the classes of market data the platform
 * provides a unified, normalized view of. Reusable abstractions only.
 */
export type MarketDataType =
  | 'OHLCV'
  | 'TRADES'
  | 'ORDER_BOOKS'
  | 'FUNDING_RATES'
  | 'OPEN_INTEREST'
  | 'LIQUIDATIONS'
  | 'OPTIONS'
  | 'VOLATILITY_SURFACE'
  | 'INDEX_PRICES'
  | 'MARK_PRICES'
  | 'CORPORATE_ACTIONS'
  | 'MACRO_DATA'
  | 'REFERENCE_DATA';

export type MarketDataCategory =
  | 'Bars'
  | 'Microstructure'
  | 'Derivatives'
  | 'Pricing'
  | 'Reference'
  | 'Macro';

export interface MarketDataTypeDescriptor {
  readonly type: MarketDataType;
  readonly label: string;
  readonly category: MarketDataCategory;
  /** Whether this type is a time series (vs. point-in-time reference data). */
  readonly timeSeries: boolean;
}

export const MARKET_DATA_TYPES: readonly MarketDataType[] = [
  'OHLCV',
  'TRADES',
  'ORDER_BOOKS',
  'FUNDING_RATES',
  'OPEN_INTEREST',
  'LIQUIDATIONS',
  'OPTIONS',
  'VOLATILITY_SURFACE',
  'INDEX_PRICES',
  'MARK_PRICES',
  'CORPORATE_ACTIONS',
  'MACRO_DATA',
  'REFERENCE_DATA',
];

const DESCRIPTORS: Record<MarketDataType, MarketDataTypeDescriptor> = {
  OHLCV: { type: 'OHLCV', label: 'OHLCV', category: 'Bars', timeSeries: true },
  TRADES: { type: 'TRADES', label: 'Trades', category: 'Microstructure', timeSeries: true },
  ORDER_BOOKS: {
    type: 'ORDER_BOOKS',
    label: 'Order books',
    category: 'Microstructure',
    timeSeries: true,
  },
  FUNDING_RATES: {
    type: 'FUNDING_RATES',
    label: 'Funding rates',
    category: 'Derivatives',
    timeSeries: true,
  },
  OPEN_INTEREST: {
    type: 'OPEN_INTEREST',
    label: 'Open interest',
    category: 'Derivatives',
    timeSeries: true,
  },
  LIQUIDATIONS: {
    type: 'LIQUIDATIONS',
    label: 'Liquidations',
    category: 'Derivatives',
    timeSeries: true,
  },
  OPTIONS: { type: 'OPTIONS', label: 'Options', category: 'Derivatives', timeSeries: true },
  VOLATILITY_SURFACE: {
    type: 'VOLATILITY_SURFACE',
    label: 'Volatility surface',
    category: 'Derivatives',
    timeSeries: true,
  },
  INDEX_PRICES: {
    type: 'INDEX_PRICES',
    label: 'Index prices',
    category: 'Pricing',
    timeSeries: true,
  },
  MARK_PRICES: { type: 'MARK_PRICES', label: 'Mark prices', category: 'Pricing', timeSeries: true },
  CORPORATE_ACTIONS: {
    type: 'CORPORATE_ACTIONS',
    label: 'Corporate actions',
    category: 'Reference',
    timeSeries: false,
  },
  MACRO_DATA: {
    type: 'MACRO_DATA',
    label: 'Macroeconomic data',
    category: 'Macro',
    timeSeries: true,
  },
  REFERENCE_DATA: {
    type: 'REFERENCE_DATA',
    label: 'Reference data',
    category: 'Reference',
    timeSeries: false,
  },
};

export function describeMarketDataType(type: MarketDataType): MarketDataTypeDescriptor {
  return DESCRIPTORS[type];
}

export function marketDataTypeLabel(type: MarketDataType): string {
  return DESCRIPTORS[type].label;
}

export function listMarketDataTypes(): readonly MarketDataTypeDescriptor[] {
  return MARKET_DATA_TYPES.map((type) => DESCRIPTORS[type]);
}
