/**
 * Canonical market-data capabilities — the reusable services the platform exposes
 * over canonical datasets. Vocabulary + descriptors only; behaviour is supplied
 * by the service application layer and infrastructure adapters.
 */
export type MarketDataCapability =
  | 'SYMBOL_RESOLUTION'
  | 'DATASET_VERSIONING'
  | 'TIME_SERIES_RETRIEVAL'
  | 'HISTORICAL_DATA'
  | 'INCREMENTAL_UPDATES'
  | 'DATA_SNAPSHOTS'
  | 'METADATA_MANAGEMENT'
  | 'DATA_CATALOG'
  | 'MARKET_CALENDAR'
  | 'TRADING_HOURS'
  | 'EXCHANGE_METADATA';

export interface MarketDataCapabilityDescriptor {
  readonly capability: MarketDataCapability;
  readonly label: string;
  readonly description: string;
}

export const MARKET_DATA_CAPABILITIES: readonly MarketDataCapability[] = [
  'SYMBOL_RESOLUTION',
  'DATASET_VERSIONING',
  'TIME_SERIES_RETRIEVAL',
  'HISTORICAL_DATA',
  'INCREMENTAL_UPDATES',
  'DATA_SNAPSHOTS',
  'METADATA_MANAGEMENT',
  'DATA_CATALOG',
  'MARKET_CALENDAR',
  'TRADING_HOURS',
  'EXCHANGE_METADATA',
];

const DESCRIPTORS: Record<MarketDataCapability, MarketDataCapabilityDescriptor> = {
  SYMBOL_RESOLUTION: {
    capability: 'SYMBOL_RESOLUTION',
    label: 'Symbol resolution',
    description: 'Resolve native/alias symbols to canonical symbols.',
  },
  DATASET_VERSIONING: {
    capability: 'DATASET_VERSIONING',
    label: 'Dataset versioning',
    description: 'Immutable, versioned canonical datasets.',
  },
  TIME_SERIES_RETRIEVAL: {
    capability: 'TIME_SERIES_RETRIEVAL',
    label: 'Time-series retrieval',
    description: 'As-of, point-in-time time-series reads.',
  },
  HISTORICAL_DATA: {
    capability: 'HISTORICAL_DATA',
    label: 'Historical data',
    description: 'Full history for a series.',
  },
  INCREMENTAL_UPDATES: {
    capability: 'INCREMENTAL_UPDATES',
    label: 'Incremental updates',
    description: 'Append-only incremental refresh.',
  },
  DATA_SNAPSHOTS: {
    capability: 'DATA_SNAPSHOTS',
    label: 'Data snapshots',
    description: 'Immutable point-in-time snapshots.',
  },
  METADATA_MANAGEMENT: {
    capability: 'METADATA_MANAGEMENT',
    label: 'Metadata management',
    description: 'Manage dataset/symbol metadata and lineage.',
  },
  DATA_CATALOG: {
    capability: 'DATA_CATALOG',
    label: 'Data catalog',
    description: 'Discoverable catalog of available data.',
  },
  MARKET_CALENDAR: {
    capability: 'MARKET_CALENDAR',
    label: 'Market calendar',
    description: 'Holidays and market events by exchange.',
  },
  TRADING_HOURS: {
    capability: 'TRADING_HOURS',
    label: 'Trading hours',
    description: 'Trading sessions and hours by exchange.',
  },
  EXCHANGE_METADATA: {
    capability: 'EXCHANGE_METADATA',
    label: 'Exchange metadata',
    description: 'Exchange reference metadata.',
  },
};

export function describeCapability(
  capability: MarketDataCapability,
): MarketDataCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly MarketDataCapabilityDescriptor[] {
  return MARKET_DATA_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
