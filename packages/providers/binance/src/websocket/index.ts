/**
 * `@platform/provider-binance/websocket` — the Binance WebSocket Market Data Streams (Phase 9.1.3): the
 * canonical real-time market-data provider for the Binance adapter. It subscribes to the officially
 * documented Binance market streams (Spot & USDⓈ-M Futures) and maps every event into the canonical
 * domain, with automatic reconnect/resubscription (via the Common WebSocket Client), a liveness
 * watchdog, and correct order-book synchronization with sequence validation and gap detection. It
 * handles market data ONLY — no authenticated user streams, no orders, no account management.
 */
export * from './events';
export type * from './binance-events';
export {
  ChannelRegistry,
  KLINE_INTERVALS_SPOT,
  KLINE_INTERVALS_FUTURES,
  ROLLING_WINDOWS,
  ROLLING_WINDOW_MS,
  DEPTH_LEVELS,
  UPDATE_SPEEDS_SPOT,
  UPDATE_SPEEDS_FUTURES,
  type MarketDataChannel,
  type RollingWindow,
  type DepthLevel,
} from './channels';
export { MarketDataValidator } from './validator';
export { EventMapper, IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from './event-mapper';
export { EventRouter } from './event-router';
export { GapDetector, SequenceValidator, type GapResult } from './sequence';
export { LocalOrderBook } from './order-book';
export {
  OrderBookSynchronizer,
  type DepthSnapshotSource,
  type RawDepthSnapshot,
  type OrderBookSyncCallbacks,
  type OrderBookSynchronizerDeps,
} from './order-book-synchronizer';
export { SubscriptionManager, type StreamConsumer } from './subscription-manager';
export { MarketDataMetrics, type MarketDataMetricsSnapshot } from './metrics';
export {
  MarketDataHealthMonitor,
  type MarketDataHealth,
  type MarketDataHealthLevel,
  type MarketDataHealthMonitorDeps,
} from './health';
export {
  TradeStream,
  AggregateTradeStream,
  TickerStream,
  MiniTickerStream,
  BookTickerStream,
  KlineStream,
  AveragePriceStream,
  MarkPriceStream,
  OrderBookStream,
  type StreamErrorHandler,
} from './streams';
export { BinanceMarketDataSocket, type BinanceMarketDataSocketDeps } from './socket';
export {
  BinanceStreamValidationError,
  BinanceSequenceGapError,
  BinanceChannelUnavailableError,
} from './errors';
