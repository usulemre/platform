/**
 * `@platform/provider-binance/orders` — the Binance Order Management API (Phase 9.1.5): the canonical
 * order-execution interface for the Binance adapter. It creates, queries, cancels and (where officially
 * supported) replaces orders through documented Binance endpoints, and maps Binance orders / fills /
 * commissions into the canonical order domain. It is reached only through the Broker Gateway provider
 * boundary and exposes ONLY canonical models — no Binance-specific order model leaves the provider. It
 * contains no trading strategy, portfolio or risk logic.
 */
export * from './canonical';
export { BinanceOrderCapabilities, type OrderOperation } from './capabilities';
export { BinanceOrderStatusMapper, BINANCE_ORDER_STATUSES } from './status-mapper';
export { BinanceFillMapper } from './fill-mapper';
export { BinanceCommissionMapper } from './commission-mapper';
export {
  BinanceOrderRequestBuilder,
  type OrderReference,
  type ReplaceOrderRequest,
} from './request-builder';
export { BinanceOrderResponseParser } from './response-parser';
export { BinanceOrderValidator } from './validator';
export { BinanceOrderErrorMapper } from './error-mapper';
export {
  BinanceOrderValidationError,
  BinanceOrderUnsupportedError,
  BinanceOrderStateError,
} from './errors';
export {
  BinanceRestOrderClient,
  type BinanceOrderClient,
  type OrderRef,
  type BinanceParamRecord,
} from './client';
export { BinanceOrderService, type BinanceOrderServiceDeps } from './service';
export {
  OrderMetrics,
  OrderHealthMonitor,
  type OrderMetricsSnapshot,
  type OrderHealth,
  type OrderHealthLevel,
  type OrderOperationKind,
} from './metrics';
// Reused mappers, surfaced here as the order module's order/execution mappers.
export { BinanceOrderMapper } from '../mappers/order-mapper';
export { BinanceExecutionMapper } from '../mappers/execution-mapper';
