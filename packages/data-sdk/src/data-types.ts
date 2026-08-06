/**
 * Canonical ingestion data-type catalog. Architectural placeholders — the set of
 * data classes the platform can ingest. The core never branches on a specific
 * provider (CP-8); it branches only on these asset-agnostic data types where a
 * capability contract requires it.
 */
export type DataType =
  | 'OHLCV'
  | 'TRADES'
  | 'ORDER_BOOKS'
  | 'FUNDING_RATES'
  | 'OPEN_INTEREST'
  | 'LIQUIDATIONS'
  | 'OPTIONS_CHAINS'
  | 'VOLATILITY_SURFACE'
  | 'CORPORATE_ACTIONS'
  | 'MACRO_DATA'
  | 'NEWS'
  | 'ALTERNATIVE_DATA';

export type DataTypeCategory =
  | 'Bars'
  | 'Microstructure'
  | 'Derivatives'
  | 'Reference'
  | 'Macro'
  | 'Text'
  | 'Alternative';

export interface DataTypeDescriptor {
  readonly type: DataType;
  readonly label: string;
  readonly category: DataTypeCategory;
  readonly description: string;
}

export const DATA_TYPES: readonly DataType[] = [
  'OHLCV',
  'TRADES',
  'ORDER_BOOKS',
  'FUNDING_RATES',
  'OPEN_INTEREST',
  'LIQUIDATIONS',
  'OPTIONS_CHAINS',
  'VOLATILITY_SURFACE',
  'CORPORATE_ACTIONS',
  'MACRO_DATA',
  'NEWS',
  'ALTERNATIVE_DATA',
];

const DESCRIPTORS: Record<DataType, DataTypeDescriptor> = {
  OHLCV: {
    type: 'OHLCV',
    label: 'OHLCV',
    category: 'Bars',
    description: 'Open/high/low/close/volume bars.',
  },
  TRADES: {
    type: 'TRADES',
    label: 'Trades',
    category: 'Microstructure',
    description: 'Tick-level trade prints.',
  },
  ORDER_BOOKS: {
    type: 'ORDER_BOOKS',
    label: 'Order books',
    category: 'Microstructure',
    description: 'L2/L3 order-book snapshots and deltas.',
  },
  FUNDING_RATES: {
    type: 'FUNDING_RATES',
    label: 'Funding rates',
    category: 'Derivatives',
    description: 'Perpetual funding rates.',
  },
  OPEN_INTEREST: {
    type: 'OPEN_INTEREST',
    label: 'Open interest',
    category: 'Derivatives',
    description: 'Aggregate open interest.',
  },
  LIQUIDATIONS: {
    type: 'LIQUIDATIONS',
    label: 'Liquidations',
    category: 'Derivatives',
    description: 'Forced-liquidation events.',
  },
  OPTIONS_CHAINS: {
    type: 'OPTIONS_CHAINS',
    label: 'Options chains',
    category: 'Derivatives',
    description: 'Options chains and greeks.',
  },
  VOLATILITY_SURFACE: {
    type: 'VOLATILITY_SURFACE',
    label: 'Volatility surface',
    category: 'Derivatives',
    description: 'Implied-volatility surfaces.',
  },
  CORPORATE_ACTIONS: {
    type: 'CORPORATE_ACTIONS',
    label: 'Corporate actions',
    category: 'Reference',
    description: 'Splits, dividends, restatements (vintage-aware).',
  },
  MACRO_DATA: {
    type: 'MACRO_DATA',
    label: 'Macroeconomic data',
    category: 'Macro',
    description: 'Economic time series and releases.',
  },
  NEWS: {
    type: 'NEWS',
    label: 'News',
    category: 'Text',
    description: 'News, filings and event feeds.',
  },
  ALTERNATIVE_DATA: {
    type: 'ALTERNATIVE_DATA',
    label: 'Alternative data',
    category: 'Alternative',
    description: 'Alternative datasets.',
  },
};

export function describeDataType(type: DataType): DataTypeDescriptor {
  return DESCRIPTORS[type];
}

export function listDataTypes(): readonly DataTypeDescriptor[] {
  return DATA_TYPES.map((type) => DESCRIPTORS[type]);
}
