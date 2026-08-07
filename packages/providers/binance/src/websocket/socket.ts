/**
 * `BinanceMarketDataSocket` — the facade for Binance real-time market-data streaming. It composes the
 * Common WebSocket Client (transport, connection state machine, automatic reconnect + resubscription)
 * with the Binance stream conventions (combined-stream `/stream` endpoint, `SUBSCRIBE`/`UNSUBSCRIBE`
 * control frames, `{ stream, data }` routing) and this module's building blocks: the subscription
 * manager, event router, typed streams, order-book synchronizer, metrics and health monitor. It
 * exposes only canonical market-data events. Every side effect (socket, scheduler, clock) is INJECTED,
 * so behaviour is deterministic and no real network is opened by the class itself.
 *
 * Heartbeat: Binance market streams have no client-initiated application-level ping (protocol-level
 * ping/pong is handled inside the socket transport); this facade adds a scheduler-driven liveness
 * watchdog that flags a STALE connection when no message arrives within the configured window.
 *
 * It handles market data ONLY — no authenticated user streams, no orders, no account management.
 */
import {
  isActive,
  WebSocketClient,
  type EventListener,
  type SocketFactory,
  type WebSocketEvents,
} from '@platform/websocket-client';
import type { Cancel, Random, Scheduler } from '@platform/http-client';
import { SystemScheduler } from '@platform/http-client';
import { ChannelRegistry } from './channels';
import { EventRouter } from './event-router';
import { SubscriptionManager } from './subscription-manager';
import { MarketDataMetrics, type MarketDataMetricsSnapshot } from './metrics';
import { MarketDataHealthMonitor, type MarketDataHealth } from './health';
import {
  AggregateTradeStream,
  AveragePriceStream,
  BookTickerStream,
  KlineStream,
  MarkPriceStream,
  MiniTickerStream,
  OrderBookStream,
  TickerStream,
  TradeStream,
} from './streams';
import { OrderBookSynchronizer, type DepthSnapshotSource } from './order-book-synchronizer';
import type { SymbolResolver } from './event-mapper';
import type { BinanceMarket } from '../constants';
import type { BinanceCombinedStreamMessage } from './binance-events';
import type { OrderBookSnapshot } from './events';

let subscribeIdCounter = 0;

export interface BinanceMarketDataSocketDeps {
  readonly market: BinanceMarket;
  /** The WebSocket base URL (e.g. `wss://stream.binance.com:9443`). */
  readonly wsBaseUrl: string;
  readonly factory: SocketFactory;
  readonly scheduler?: Scheduler;
  readonly random?: Random;
  readonly clock?: () => number;
  readonly resolver?: SymbolResolver;
  /** REST depth-snapshot source; required only for maintained order books. */
  readonly depthSource?: DepthSnapshotSource;
  readonly reconnectMaxAttempts?: number;
  /** Liveness watchdog window (ms); default 30s. */
  readonly stalenessMs?: number;
  readonly onError?: (error: Error) => void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class BinanceMarketDataSocket {
  readonly market: BinanceMarket;
  private readonly client: WebSocketClient;
  private readonly subs: SubscriptionManager;
  private readonly channels: ChannelRegistry;
  private readonly router: EventRouter;
  private readonly metrics = new MarketDataMetrics();
  private readonly healthMonitor: MarketDataHealthMonitor;
  private readonly scheduler: Scheduler;
  private readonly synchronizer?: OrderBookSynchronizer;
  private readonly orderBookHandlers = new Map<
    string,
    Set<(snapshot: OrderBookSnapshot) => void>
  >();
  private readonly stalenessMs: number;
  private readonly onError?: (error: Error) => void;
  private watchdog?: Cancel;
  private running = false;

  readonly trades: TradeStream;
  readonly aggregateTrades: AggregateTradeStream;
  readonly tickers: TickerStream;
  readonly miniTickers: MiniTickerStream;
  readonly bookTickers: BookTickerStream;
  readonly klines: KlineStream;
  readonly averagePrices: AveragePriceStream;
  readonly markPrices: MarkPriceStream;
  readonly orderBooks: OrderBookStream;

  constructor(deps: BinanceMarketDataSocketDeps) {
    this.market = deps.market;
    this.onError = deps.onError;
    this.scheduler = deps.scheduler ?? new SystemScheduler();
    this.stalenessMs = deps.stalenessMs ?? 30_000;
    const clock = deps.clock ?? (() => this.scheduler.now());
    this.channels = new ChannelRegistry(deps.market);
    this.router = new EventRouter(deps.market, deps.resolver);
    this.healthMonitor = new MarketDataHealthMonitor({ clock, stalenessMs: this.stalenessMs });

    this.client = new WebSocketClient({
      url: `${deps.wsBaseUrl}/stream`,
      factory: deps.factory,
      scheduler: this.scheduler,
      random: deps.random,
      reconnect: { maxAttempts: deps.reconnectMaxAttempts ?? 5 },
      buildSubscribe: (topic) => ({
        method: 'SUBSCRIBE',
        params: [topic],
        id: (subscribeIdCounter += 1),
      }),
      buildUnsubscribe: (topic) => ({
        method: 'UNSUBSCRIBE',
        params: [topic],
        id: (subscribeIdCounter += 1),
      }),
      resolveTopic: (message) =>
        isObject(message) && typeof message['stream'] === 'string'
          ? (message['stream'] as string)
          : undefined,
      isControl: (message) => isObject(message) && 'result' in message,
      onControl: () => undefined,
    });

    this.subs = new SubscriptionManager(this.client);

    // Central metrics/liveness accounting for every inbound data message.
    this.client.on('message', ({ message }) => {
      if (isObject(message) && typeof message['stream'] === 'string') {
        this.metrics.onMessage(message['stream'] as string, clock());
        this.healthMonitor.recordMessage();
      }
    });

    const streamError = (error: Error): void => {
      this.metrics.onValidationError();
      this.onError?.(error);
    };
    this.trades = new TradeStream(this.subs, this.router, this.channels, streamError);
    this.aggregateTrades = new AggregateTradeStream(
      this.subs,
      this.router,
      this.channels,
      streamError,
    );
    this.tickers = new TickerStream(this.subs, this.router, this.channels, streamError);
    this.miniTickers = new MiniTickerStream(this.subs, this.router, this.channels, streamError);
    this.bookTickers = new BookTickerStream(this.subs, this.router, this.channels, streamError);
    this.klines = new KlineStream(this.subs, this.router, this.channels, streamError);
    this.averagePrices = new AveragePriceStream(this.subs, this.router, this.channels, streamError);
    this.markPrices = new MarkPriceStream(this.subs, this.router, this.channels, streamError);
    this.orderBooks = new OrderBookStream(this.subs, this.router, this.channels, streamError);

    if (deps.depthSource) {
      this.synchronizer = new OrderBookSynchronizer({
        market: deps.market,
        source: deps.depthSource,
        resolver: deps.resolver,
        callbacks: {
          onSnapshot: (snapshot) => {
            for (const handler of this.orderBookHandlers.get(snapshot.venueSymbol) ?? [])
              handler(snapshot);
          },
          onGap: (error) => {
            this.metrics.onGap();
            this.onError?.(error);
          },
          onResync: () => this.metrics.onResync(),
        },
      });
    }
  }

  /* ------------------------------ lifecycle ------------------------------ */

  /** Open the connection (resolves once healthy) and start the liveness watchdog. */
  async connect(): Promise<void> {
    this.running = true;
    await this.client.connect();
    this.scheduleWatchdog();
  }

  /** Close the connection, unsubscribe all streams and stop the watchdog. */
  close(): void {
    this.running = false;
    this.watchdog?.();
    this.watchdog = undefined;
    this.subs.clear();
    this.client.close();
  }

  /** The underlying connection state (from the Common WebSocket Client's state machine). */
  get state(): string {
    return this.client.state;
  }

  /** Whether the connection is currently active. */
  get connected(): boolean {
    return isActive(this.client.state);
  }

  /** Subscribe to a lifecycle event of the underlying client (open/close/error/reconnected/…). */
  on<K extends keyof WebSocketEvents>(
    type: K,
    listener: EventListener<WebSocketEvents[K]>,
  ): () => void {
    return this.client.on(type, listener);
  }

  /* ------------------------------ maintained order book ------------------------------ */

  /**
   * Maintain a synchronized local order book for a symbol per the official procedure: subscribe to the
   * diff-depth stream (buffering), fetch a REST snapshot and reconcile, then emit an immutable snapshot
   * on every applied update. Requires a `depthSource`. Returns an unsubscribe handle.
   */
  maintainOrderBook(
    symbol: string,
    handler: (snapshot: OrderBookSnapshot) => void,
    speedMs?: number,
  ): () => void {
    if (!this.synchronizer)
      throw new Error('maintainOrderBook requires a depthSource in the socket configuration.');
    const synchronizer = this.synchronizer;
    const venueSymbol = symbol.replace(/[-/_]/g, '').toUpperCase();
    let handlers = this.orderBookHandlers.get(venueSymbol);
    if (!handlers) {
      handlers = new Set();
      this.orderBookHandlers.set(venueSymbol, handlers);
    }
    handlers.add(handler);

    synchronizer.begin(venueSymbol);
    const unsubscribe = this.orderBooks.subscribeDiff(
      symbol,
      (delta) => synchronizer.handleDelta(delta),
      speedMs,
    );
    void synchronizer.synchronize(venueSymbol);

    return () => {
      unsubscribe();
      const set = this.orderBookHandlers.get(venueSymbol);
      set?.delete(handler);
      if (set && set.size === 0) {
        this.orderBookHandlers.delete(venueSymbol);
        synchronizer.stop(venueSymbol);
      }
    };
  }

  /** The current maintained book for a symbol (undefined until first synchronized). */
  orderBookSnapshot(symbol: string, limit?: number): OrderBookSnapshot | undefined {
    const venueSymbol = symbol.replace(/[-/_]/g, '').toUpperCase();
    return this.synchronizer?.book(venueSymbol, limit);
  }

  /* ------------------------------ observability ------------------------------ */

  /** A snapshot of the connection's market-data metrics. */
  metricsSnapshot(): MarketDataMetricsSnapshot {
    return this.metrics.snapshot(this.subs.size);
  }

  /** The current market-data health. */
  health(): MarketDataHealth {
    return this.healthMonitor.evaluate(this.connected, this.subs.size, this.metricsSnapshot().gaps);
  }

  /** The active stream names. */
  activeStreams(): readonly string[] {
    return this.subs.active();
  }

  private scheduleWatchdog(): void {
    this.watchdog = this.scheduler.schedule(() => {
      this.watchdog = undefined;
      if (!this.running) return;
      // Recompute health; a STALE result signals the watchdog that liveness lapsed.
      this.health();
      this.scheduleWatchdog();
    }, this.stalenessMs);
  }
}

export type { BinanceCombinedStreamMessage };
