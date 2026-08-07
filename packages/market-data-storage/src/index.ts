/**
 * `@platform/market-data-storage` — the canonical Market Data Storage layer (Phase 10.2).
 *
 * The provider-independent persistence layer that receives ONLY canonical market data produced by the
 * Market Data Ingestion Pipeline (Phase 10.1), validates it against the storage schema, writes it
 * idempotently into partitioned time-series storage, and serves it back to Dataset / Research /
 * Feature / Backtesting through canonical queries and typed repositories.
 *
 * It imports NO provider code and knows nothing of Binance: it depends only on the canonical models
 * (`@platform/market-data-ingestion`, `@platform/market-data-sdk`). `MarketDataStorage` implements the
 * ingestion pipeline's `CanonicalMarketDataStore` port, so:
 *
 *   Provider → Ingestion → Canonical Storage → Dataset / Research / Feature / Backtesting
 *
 * is the only supported market-data persistence path. The concrete engine is pluggable
 * (`StorageEngine`); an in-memory reference implementation ships here.
 */

// Foundations
export * from './errors';
export * from './identity';
export * from './partition';
export * from './dead-letter';

// Engine (pluggable persistence seam)
export * from './engine/storage-engine';

// Validation
export * from './validation/storage-validator';

// Write path
export * from './write/market-data-writer';

// Read path
export * from './query/query-repository';
export * from './query/repositories';

// Lifecycle & observability
export * from './retention/retention-manager';
export * from './metrics/storage-metrics';
export * from './health/storage-health-monitor';

// Façade
export * from './storage';

// Production persistent engine (ClickHouse) + composition-root factory
export * from './clickhouse';
