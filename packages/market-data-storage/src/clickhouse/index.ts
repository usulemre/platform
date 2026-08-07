/**
 * `@platform/market-data-storage/clickhouse` — the production, persistent ClickHouse implementation of
 * the canonical {@link StorageEngine} port. Import `createMarketDataStorage` (the composition root) to
 * wire a ClickHouse-backed {@link MarketDataStorage}; the rest of the platform continues to use the
 * unchanged canonical storage contract.
 */
export * from './config';
export * from './client';
export * from './errors';
export * from './schema';
export * from './migrations';
export * from './serialization';
export * from './query-builder';
export * from './metrics';
export * from './health';
export * from './clickhouse-storage-engine';
export * from './factory';
