/**
 * `@platform/provider-binance` — the production Binance & Binance Futures broker/venue adapter.
 *
 * This package supplies the Broker Gateway with a live Binance adapter that implements the SDK's
 * `BrokerProviderPort` capability contract and a richer canonical trading/market-data surface on top.
 * It is built entirely on the shared foundations — the Common HTTP Client, Common WebSocket Client,
 * Authentication Core, Retry & Timeout Engine, Circuit Breaker, Rate Limiter — and the Broker Gateway
 * SDK, and it depends on nothing else in the platform (strict provider isolation, CP-8). Every venue
 * specific — REST paths, request signing, WebSocket protocol, field names, error codes — is confined
 * to this package behind the canonical contracts.
 *
 * Composition. `providerFactories` are the zero-argument factories the broker-gateway service's
 * composition root merges into its provider registry (unchanged integration seam). They build a real
 * adapter with fail-closed defaults: no secrets resolve until a `SecretProvider` is injected, and no
 * network IO happens at construction. Use {@link createBinanceProvider} to build a fully-injected
 * adapter (transport, socket factory, secrets, clock) for production or tests.
 */
import {
  describeProvider,
  type BrokerProviderFactory,
  type ProviderId,
} from '@platform/broker-sdk';
import { BinanceProvider, type BinanceProviderDeps } from './provider';

/** The provider id(s) served by this package. */
export const PROVIDER_IDS: readonly ProviderId[] = ['binance', 'binance-futures'];

/** The canonical descriptor(s) for the provider id(s) this package serves. */
export const PROVIDER_DESCRIPTORS = PROVIDER_IDS.map(describeProvider);

/** Construct a fully-injected Binance adapter (defaults to the Spot provider id). */
export function createBinanceProvider(deps: BinanceProviderDeps = {}): BinanceProvider {
  const providerId = deps.providerId ?? 'binance';
  if (!PROVIDER_IDS.includes(providerId))
    throw new Error(`@platform/provider-binance does not serve provider "${providerId}".`);
  return new BinanceProvider(deps);
}

/** The registry entries this package contributes (id → zero-arg factory), for gateway composition. */
export const providerFactories: Readonly<Record<string, BrokerProviderFactory>> = {
  binance: () => new BinanceProvider({ providerId: 'binance' }),
  'binance-futures': () => new BinanceProvider({ providerId: 'binance-futures' }),
};

export { BinanceProvider, type BinanceProviderDeps } from './provider';
export {
  BinanceRestClient,
  type BinanceRestClientDeps,
  type TimestampSource,
} from './http/rest-client';
export {
  createResilientHttpClient,
  type ResilienceOptions,
  type ResilientHttpClient,
} from './http/resilience';
export { BinanceWebSocketClient, type UserDataHandlers } from './ws/websocket-client';
export { BinanceMapper } from './mappers/mapper';
export { BinanceSymbolMapper } from './mappers/symbol-mapper';
export { BinanceOrderMapper } from './mappers/order-mapper';
export { BinanceTradeMapper } from './mappers/trade-mapper';
export { BinanceBalanceMapper } from './mappers/balance-mapper';
export { BinancePositionMapper } from './mappers/position-mapper';
export { BinanceExecutionMapper } from './mappers/execution-mapper';
export { BinanceMarketDataMapper } from './mappers/market-data-mapper';
export { BinanceCapabilityRegistry } from './capability-registry';
export { BinanceHealthMonitor } from './health-monitor';
export { BinanceServerTimeSync, type ServerTimeFetcher } from './time-sync';
export { BinanceExchangeInfoCache, type ExchangeInfoFetcher } from './exchange-info';
export {
  resolveBinanceConfiguration,
  type BinanceConfiguration,
  type BinanceConfigOverrides,
} from './config';
export {
  BinanceError,
  BinanceApiError,
  BinanceConfigurationError,
  BinanceErrorMapper,
  type BinanceErrorCategory,
} from './errors';
export { MARKET_BY_PROVIDER, REST_PATHS, DEFAULT_ENDPOINTS, type BinanceMarket } from './constants';
export * from './types/canonical';
export type * from './types/binance';

// Phase 9.1.1 — Exchange Metadata & Symbol Registry (single source of truth for Binance symbols).
export * from './metadata';

// Phase 9.1.3 — WebSocket Market Data Streams (canonical real-time market-data provider).
export * from './websocket';

// Phase 9.1.4 — Authentication & User Data Streams (authenticated communication layer).
export * from './auth';

// Phase 9.1.5 — Order Management API (canonical order-execution interface). Selective re-exports:
// the reused BinanceOrderMapper/BinanceExecutionMapper and the base Canonical* order types are
// already exported above (from ./mappers and ./types/canonical), so only the new surface is re-exported.
export {
  BinanceOrderService,
  type BinanceOrderServiceDeps,
  BinanceRestOrderClient,
  type BinanceOrderClient,
  type OrderRef,
  type BinanceParamRecord,
  BinanceOrderRequestBuilder,
  type OrderReference,
  type ReplaceOrderRequest,
  BinanceOrderResponseParser,
  BinanceOrderValidator,
  BinanceOrderErrorMapper,
  BinanceOrderStatusMapper,
  BINANCE_ORDER_STATUSES,
  BinanceFillMapper,
  BinanceCommissionMapper,
  BinanceOrderCapabilities,
  type OrderOperation,
  OrderMetrics,
  OrderHealthMonitor,
  type OrderMetricsSnapshot,
  type OrderHealth,
  type OrderHealthLevel,
  type OrderOperationKind,
  BinanceOrderValidationError,
  BinanceOrderUnsupportedError,
  BinanceOrderStateError,
  type CanonicalFill,
  type CanonicalCommission,
  type CanonicalOrderResponse,
  type CanonicalOrderError,
  type CanonicalOrderErrorCategory,
  type CanonicalOrderSide,
} from './orders';
