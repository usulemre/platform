/**
 * `BinanceWebSocketClient` — the Binance streaming surface, built on the Common WebSocket Client. It
 * layers Binance's stream conventions (combined-stream `{ stream, data }` envelopes, `SUBSCRIBE`/
 * `UNSUBSCRIBE` control frames, and the `/ws/<listenKey>` user-data channel) onto the provider-neutral
 * client via its injected hooks — the underlying client bakes in NO protocol. Every raw payload is
 * translated to a canonical model by the injected {@link BinanceMapper} before it reaches a handler, so
 * subscribers only ever see venue-neutral data. The socket transport and scheduler are INJECTED: the
 * client opens no real network by itself and is fully deterministic under test.
 */
import { WebSocketClient, type SocketFactory } from '@platform/websocket-client';
import type { Random, Scheduler } from '@platform/http-client';
import type { BinanceConfiguration } from '../config';
import type { BinanceExchangeInfoCache } from '../exchange-info';
import type { BinanceMapper } from '../mappers/mapper';
import type {
  BinanceDepthEvent,
  BinanceExecutionReport,
  BinanceKlineEvent,
  BinanceStreamEnvelope,
  BinanceTickerEvent,
} from '../types/binance';
import type {
  CanonicalExecution,
  CanonicalKline,
  CanonicalOrderBook,
  CanonicalTicker,
} from '../types/canonical';

let subscribeIdCounter = 0;

export interface BinanceWebSocketClientDeps {
  readonly config: BinanceConfiguration;
  readonly mapper: BinanceMapper;
  readonly factory: SocketFactory;
  readonly scheduler?: Scheduler;
  readonly random?: Random;
  readonly exchangeInfo?: BinanceExchangeInfoCache;
}

/** Handlers for a user-data stream. */
export interface UserDataHandlers {
  readonly onExecution?: (execution: CanonicalExecution) => void;
  readonly onRaw?: (message: unknown) => void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class BinanceWebSocketClient {
  private readonly config: BinanceConfiguration;
  private readonly mapper: BinanceMapper;
  private readonly factory: SocketFactory;
  private readonly scheduler?: Scheduler;
  private readonly random?: Random;
  private readonly exchangeInfo?: BinanceExchangeInfoCache;
  private marketStream?: WebSocketClient;

  constructor(deps: BinanceWebSocketClientDeps) {
    this.config = deps.config;
    this.mapper = deps.mapper;
    this.factory = deps.factory;
    this.scheduler = deps.scheduler;
    this.random = deps.random;
    this.exchangeInfo = deps.exchangeInfo;
  }

  /** The lazily-created combined market-data stream connection. */
  private stream(): WebSocketClient {
    if (!this.marketStream) {
      this.marketStream = new WebSocketClient({
        url: `${this.config.wsBaseUrl}/stream`,
        factory: this.factory,
        scheduler: this.scheduler,
        random: this.random,
        reconnect: { maxAttempts: this.config.reconnectMaxAttempts },
        // Binance subscription control frames + combined-stream routing.
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
        // Subscription acks (`{ result, id }`) are control, not data.
        isControl: (message) => isObject(message) && 'result' in message,
        onControl: () => undefined,
      });
    }
    return this.marketStream;
  }

  /** Open the market-data connection (resolves once healthy). */
  connect(): Promise<void> {
    return this.stream().connect();
  }

  /** Close the market-data connection. */
  close(): void {
    this.marketStream?.close();
  }

  private symbolInfo(binanceSymbol: string) {
    return this.exchangeInfo?.get(binanceSymbol);
  }

  private static payload(message: unknown): unknown {
    return isObject(message) && 'data' in message
      ? (message as unknown as BinanceStreamEnvelope).data
      : message;
  }

  /** Subscribe to a canonical symbol's ticker stream; handler receives canonical tickers. */
  subscribeTicker(canonicalSymbol: string, handler: (ticker: CanonicalTicker) => void): void {
    const binanceSymbol = this.mapper.symbols.toBinance(canonicalSymbol);
    const topic = `${binanceSymbol.toLowerCase()}@ticker`;
    this.stream().subscribe(topic, (message) => {
      const data = BinanceWebSocketClient.payload(message) as BinanceTickerEvent;
      handler(this.mapper.marketData.tickerEvent(data, this.symbolInfo(binanceSymbol)));
    });
  }

  /** Subscribe to a canonical symbol's kline stream at an interval. */
  subscribeKline(
    canonicalSymbol: string,
    interval: string,
    handler: (kline: CanonicalKline) => void,
  ): void {
    const binanceSymbol = this.mapper.symbols.toBinance(canonicalSymbol);
    const topic = `${binanceSymbol.toLowerCase()}@kline_${interval}`;
    this.stream().subscribe(topic, (message) => {
      const data = BinanceWebSocketClient.payload(message) as BinanceKlineEvent;
      handler(this.mapper.marketData.klineEvent(data, this.symbolInfo(binanceSymbol)));
    });
  }

  /** Subscribe to a canonical symbol's order-book diff stream. */
  subscribeOrderBook(canonicalSymbol: string, handler: (book: CanonicalOrderBook) => void): void {
    const binanceSymbol = this.mapper.symbols.toBinance(canonicalSymbol);
    const topic = `${binanceSymbol.toLowerCase()}@depth`;
    this.stream().subscribe(topic, (message) => {
      const data = BinanceWebSocketClient.payload(message) as BinanceDepthEvent;
      handler(this.mapper.marketData.depthEventToOrderBook(data, this.symbolInfo(binanceSymbol)));
    });
  }

  /** Unsubscribe from a market-data topic (canonical symbol + suffix, e.g. `@ticker`). */
  unsubscribe(canonicalSymbol: string, suffix: string): void {
    const topic = `${this.mapper.symbols.toBinance(canonicalSymbol).toLowerCase()}${suffix}`;
    this.marketStream?.unsubscribe(topic);
  }

  /**
   * Open a user-data stream on `/ws/<listenKey>`. User-data events arrive unsolicited (no subscription
   * frame), so they are consumed via the raw message hook and dispatched by event type. The returned
   * client owns the connection lifecycle (the caller keeps the listen key alive via REST).
   */
  openUserDataStream(listenKey: string, handlers: UserDataHandlers): WebSocketClient {
    const client = new WebSocketClient({
      url: `${this.config.wsBaseUrl}/ws/${listenKey}`,
      factory: this.factory,
      scheduler: this.scheduler,
      random: this.random,
      reconnect: { maxAttempts: this.config.reconnectMaxAttempts },
    });
    client.on('message', ({ message }) => {
      handlers.onRaw?.(message);
      if (!isObject(message)) return;
      const event = message['e'];
      if (event === 'executionReport' || event === 'ORDER_TRADE_UPDATE') {
        const report =
          event === 'ORDER_TRADE_UPDATE' && isObject(message['o'])
            ? (message['o'] as unknown as BinanceExecutionReport)
            : (message as unknown as BinanceExecutionReport);
        handlers.onExecution?.(
          this.mapper.executions.toCanonical(report, this.symbolInfo(report.s)),
        );
      }
    });
    void client.connect();
    return client;
  }
}
