/**
 * The typed market-data **streams** — one thin, strongly-typed class per Binance channel. Each binds a
 * documented stream name (via the {@link ChannelRegistry}) to a canonical-event handler, routing raw
 * payloads through the shared {@link EventRouter}. They add no transport of their own: subscription,
 * fan-out, reconnect and resubscription all live in the {@link SubscriptionManager} / Common WebSocket
 * Client. Each `subscribe*` returns an unsubscribe handle. Handlers only ever receive immutable
 * canonical events.
 */
import type { ChannelRegistry, DepthLevel, RollingWindow } from './channels';
import type { EventRouter } from './event-router';
import type { SubscriptionManager } from './subscription-manager';
import type {
  AggregateTradeEvent,
  AveragePriceEvent,
  BookTickerEvent,
  CandlestickEvent,
  MarkPriceEvent,
  MarketDataEvent,
  MarketTradeEvent,
  OrderBookDelta,
  OrderBookSnapshot,
  TickerEvent,
} from './events';

export type StreamErrorHandler = (error: Error) => void;

abstract class BaseStream {
  constructor(
    protected readonly subs: SubscriptionManager,
    protected readonly router: EventRouter,
    protected readonly channels: ChannelRegistry,
    protected readonly onError?: StreamErrorHandler,
  ) {}

  /** Subscribe to a stream, delivering only events of the expected `kind`. */
  protected bind<T extends MarketDataEvent>(
    streamName: string,
    kind: T['kind'],
    handler: (event: T) => void,
  ): () => void {
    return this.subs.subscribe(streamName, (data) => {
      let event: MarketDataEvent | undefined;
      try {
        event = this.router.route(streamName, data);
      } catch (error) {
        this.onError?.(error as Error);
        return;
      }
      if (event && event.kind === kind) handler(event as T);
    });
  }
}

/** `<symbol>@trade`. */
export class TradeStream extends BaseStream {
  subscribe(symbol: string, handler: (event: MarketTradeEvent) => void): () => void {
    return this.bind(this.channels.trade(symbol), 'trade', handler);
  }
}

/** `<symbol>@aggTrade`. */
export class AggregateTradeStream extends BaseStream {
  subscribe(symbol: string, handler: (event: AggregateTradeEvent) => void): () => void {
    return this.bind(this.channels.aggTrade(symbol), 'aggTrade', handler);
  }
}

/** `<symbol>@ticker` and `<symbol>@ticker_<window>` (rolling-window statistics). */
export class TickerStream extends BaseStream {
  subscribe(symbol: string, handler: (event: TickerEvent) => void): () => void {
    return this.bind(this.channels.ticker(symbol), 'ticker', handler);
  }
  subscribeRollingWindow(
    symbol: string,
    window: RollingWindow,
    handler: (event: TickerEvent) => void,
  ): () => void {
    return this.bind(this.channels.rollingTicker(symbol, window), 'ticker', handler);
  }
}

/** `<symbol>@miniTicker`. */
export class MiniTickerStream extends BaseStream {
  subscribe(symbol: string, handler: (event: TickerEvent) => void): () => void {
    return this.bind(this.channels.miniTicker(symbol), 'ticker', handler);
  }
}

/** `<symbol>@bookTicker`. */
export class BookTickerStream extends BaseStream {
  subscribe(symbol: string, handler: (event: BookTickerEvent) => void): () => void {
    return this.bind(this.channels.bookTicker(symbol), 'bookTicker', handler);
  }
}

/** `<symbol>@kline_<interval>`. */
export class KlineStream extends BaseStream {
  subscribe(
    symbol: string,
    interval: string,
    handler: (event: CandlestickEvent) => void,
  ): () => void {
    return this.bind(this.channels.kline(symbol, interval), 'kline', handler);
  }
}

/** `<symbol>@avgPrice` (Spot). */
export class AveragePriceStream extends BaseStream {
  subscribe(symbol: string, handler: (event: AveragePriceEvent) => void): () => void {
    return this.bind(this.channels.avgPrice(symbol), 'avgPrice', handler);
  }
}

/** `<symbol>@markPrice[@1s]` (Futures). */
export class MarkPriceStream extends BaseStream {
  subscribe(
    symbol: string,
    handler: (event: MarkPriceEvent) => void,
    everySecond = false,
  ): () => void {
    return this.bind(this.channels.markPrice(symbol, everySecond), 'markPrice', handler);
  }
}

/** Partial-book (`@depth<levels>`) snapshots and diff (`@depth`) deltas. */
export class OrderBookStream extends BaseStream {
  /** Partial book depth: a self-contained snapshot at each update. */
  subscribePartial(
    symbol: string,
    levels: DepthLevel,
    handler: (event: OrderBookSnapshot) => void,
    speedMs?: number,
  ): () => void {
    return this.bind(
      this.channels.partialDepth(symbol, levels, speedMs),
      'orderBookSnapshot',
      handler,
    );
  }

  /** Diff depth: raw deltas (feed these to the OrderBookSynchronizer for a maintained book). */
  subscribeDiff(
    symbol: string,
    handler: (event: OrderBookDelta) => void,
    speedMs?: number,
  ): () => void {
    return this.bind(this.channels.diffDepth(symbol, speedMs), 'orderBookDelta', handler);
  }
}
