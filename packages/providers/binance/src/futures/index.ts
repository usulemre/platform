/**
 * `@platform/provider-binance/futures` — the Binance USDⓈ-M Futures Trading integration (Phase 9.1.7):
 * the canonical Futures execution capability of the Binance provider. It implements the officially
 * documented Futures REST and user-data APIs and maps every Futures-specific concept — leverage, margin
 * type, position mode, mark price, funding, hedge-mode position sides, `reduceOnly`/`closePosition`,
 * trailing stops — into the platform's canonical trading/order/position/account models. It is reached
 * only through the Broker Gateway provider boundary and exposes ONLY canonical models: no Binance
 * Futures DTO leaves the provider. It contains no trading strategy, portfolio or risk logic, and it is
 * strictly isolated (built on the shared HTTP/WebSocket/auth/resilience foundations only).
 */
export * from './types';
export * from './events';
export type * from './binance-events';
export {
  toFuturesOrderType,
  fromFuturesOrderType,
  toCanonicalPositionSide,
  toCanonicalMarginType,
  toPositionMode,
  fromPositionMode,
  FUTURES_ORDER_TYPES,
  FUTURES_POSITION_SIDES,
  FUTURES_MARGIN_TYPES,
  FUTURES_WORKING_TYPES,
} from './constants';
export { BinanceFuturesCapabilityRegistry, type FuturesOperation } from './capability-registry';
export {
  BinanceFuturesValidationError,
  BinanceFuturesUnsupportedError,
  BinanceFuturesConfigError,
} from './errors';
export { BinanceFuturesErrorMapper } from './error-mapper';
export { BinanceFuturesRequestBuilder, type FuturesModifyRequest } from './request-builder';
export { BinanceFuturesMapper } from './mapper';
export { BinanceFuturesOrderMapper } from './order-mapper';
export { BinanceFuturesPositionMapper } from './position-mapper';
export { BinanceFuturesAccountMapper } from './account-mapper';
export { BinanceFuturesConfigMapper } from './config-mapper';
export { BinanceFuturesMetadataMapper } from './metadata-mapper';
export { BinanceFuturesValidator } from './validator';
export { BinanceFuturesRestClient } from './rest-client';
export {
  type BinanceFuturesClientPort,
  type FuturesTradingClient,
  type FuturesAccountClient,
  type FuturesConfigClient,
  type FuturesMarketDataClient,
  type BinanceParamRecord,
} from './client';
export {
  BinanceFuturesMetrics,
  FuturesHealthMonitor,
  type FuturesMetricsSnapshot,
  type FuturesHealth,
  type FuturesHealthLevel,
  type FuturesOperationKind,
} from './metrics';
export {
  BinanceFuturesOrderService,
  type BinanceFuturesOrderServiceDeps,
  type FuturesCancelAllResult,
} from './order-service';
export {
  BinanceFuturesPositionService,
  type BinanceFuturesPositionServiceDeps,
} from './position-service';
export {
  BinanceFuturesAccountService,
  type BinanceFuturesAccountServiceDeps,
} from './account-service';
export {
  BinanceFuturesBalanceService,
  type BinanceFuturesBalanceServiceDeps,
} from './balance-service';
export {
  BinanceFuturesMetadataService,
  type BinanceFuturesMetadataServiceDeps,
} from './metadata-service';
export { BinanceFuturesEventMapper } from './event-mapper';
export {
  BinanceFuturesWebSocketClient,
  type BinanceFuturesWebSocketClientDeps,
} from './websocket-client';
export { BinanceFuturesClient, type BinanceFuturesClientDeps } from './futures-client';
