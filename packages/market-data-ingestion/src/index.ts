/**
 * `@platform/market-data-ingestion` — the canonical Market Data Ingestion Pipeline (Phase 10.1).
 *
 * The provider-independent layer that receives canonical market-data events from provider adapters
 * (Binance, and any future venue), validates and normalizes them, keeps order books synchronized,
 * detects duplicates/gaps/out-of-order events, buffers and batches under backpressure, quarantines
 * what it cannot accept, and delivers immutable canonical records into the platform's canonical store
 * for Dataset / Research / Feature / Backtesting to consume.
 *
 * The core imports NO provider SDK, DTO, client, or enum. Providers integrate only through the
 * neutral contracts in {@link ./provider/provider-source}: `MarketDataConsumer`,
 * `ProviderMarketDataSource`, and `OrderBookSnapshotSource`.
 *
 * Canonical flow:
 *   Provider → MarketDataIngestionGateway → IngestionRouter → SchemaValidator → SymbolNormalizer →
 *     DataQualityValidator → (SequenceValidator · DuplicateDetector | OrderBookSynchronizer) →
 *     CanonicalNormalizer → IngestionBuffer → BatchProcessor → CanonicalMarketDataStore
 */

// Foundations
export * from './clock';
export * from './errors';

// Canonical vocabulary
export * from './events';

// Provider integration seams (the only provider boundary)
export * from './provider/provider-source';

// Instruments & normalization
export * from './instruments/instrument-registry';
export * from './normalization';

// Validation
export * from './validation';

// Sequencing
export * from './sequencing';

// Order book
export * from './orderbook';

// Buffering, batching, dead-letter, store
export * from './buffer';
export * from './dead-letter/dead-letter-queue';
export * from './store/market-data-store';

// Routing, state, metrics, health
export * from './routing/ingestion-router';
export * from './state/ingestion-state';
export * from './metrics/ingestion-metrics';
export * from './health/health-monitor';

// Pipeline & gateway
export * from './pipeline/pipeline';
export * from './gateway/ingestion-gateway';
