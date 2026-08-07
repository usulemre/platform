/**
 * `@platform/provider-binance/metadata` — the Binance Exchange Metadata & Symbol Registry (Phase
 * 9.1.1): the canonical metadata foundation and single source of truth for Binance instruments. It
 * discovers, validates, caches and exposes exchange metadata, mapping every venue model into the
 * canonical domain. It contains NO market-data streams, NO orders and NO trading logic — only metadata
 * discovery, mapping, validation and the derived read-model registries.
 */
export * from './types';
export { FilterMapper } from './filter-mapper';
export { PrecisionMapper, precisionFromIncrement } from './precision-mapper';
export { TradingRuleMapper } from './trading-rule-mapper';
export { ExchangeSymbolMapper } from './symbol-mapper';
export { ExchangeMetadataMapper } from './metadata-mapper';
export { MetadataValidator, type MetadataValidationResult } from './validator';
export { ExchangeMetadataCache, type ExchangeMetadataCacheDeps } from './cache';
export { InMemoryExchangeMetadataRepository, type ExchangeMetadataRepository } from './repository';
export { SymbolRegistry } from './symbol-registry';
export { TradingPairRegistry } from './trading-pair-registry';
export { AssetRegistry } from './asset-registry';
export { ExchangeCapabilityRegistry } from './capability-registry';
export {
  MetadataRefresher,
  type MetadataRefresherDeps,
  type ExchangeMetadataSource,
  type MetadataMonitor,
} from './refresher';
export {
  ExchangeMetadataService,
  createExchangeMetadataService,
  type ExchangeMetadataServiceDeps,
} from './service';
export { BinanceMetadataError } from './errors';
