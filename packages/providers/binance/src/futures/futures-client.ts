/**
 * `BinanceFuturesClient` — the aggregate USDⓈ-M Futures capability façade for a single broker binding.
 * It composes the Futures services (orders, positions & risk configuration, account, balances,
 * derivatives metadata) over one injected Futures REST port ({@link BinanceFuturesClientPort}, normally
 * {@link BinanceFuturesRestClient} wrapping the resilient signed REST client) and, when a socket factory
 * is provided, the Futures user-data WebSocket client. It exposes ONLY canonical Futures models and
 * performs no trading strategy, portfolio or risk logic — it executes and reads the Futures operations
 * it is asked to. Services are memoized; the order service consults the position service's cached
 * position mode so hedge/one-way validation is honoured.
 */
import type { Random, Scheduler } from '@platform/http-client';
import type { SocketFactory } from '@platform/websocket-client';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import { BinanceFuturesCapabilityRegistry } from './capability-registry';
import { BinanceFuturesMetrics } from './metrics';
import { BinanceFuturesOrderService } from './order-service';
import { BinanceFuturesPositionService } from './position-service';
import { BinanceFuturesAccountService } from './account-service';
import { BinanceFuturesBalanceService } from './balance-service';
import { BinanceFuturesMetadataService } from './metadata-service';
import { BinanceFuturesWebSocketClient } from './websocket-client';
import { BinanceFuturesUnsupportedError } from './errors';
import type { BinanceFuturesClientPort } from './client';
import type { BinanceSymbolInfo } from '../types/binance';
import type { ExchangeSymbol } from '../metadata/types';
import type { FuturesMetricsSnapshot } from './metrics';

export interface BinanceFuturesClientDeps {
  /** The Futures REST port (order + account + config + market-data). */
  readonly rest: BinanceFuturesClientPort;
  readonly resolver?: SymbolResolver;
  /** Instrument metadata lookup (venue symbol → info) for canonical symbol naming. */
  readonly symbolInfo?: (venueSymbol: string) => BinanceSymbolInfo | undefined;
  /** Canonical instrument lookup (for trading-rule validation). */
  readonly exchangeSymbol?: (symbol: string) => ExchangeSymbol | undefined;
  readonly clock?: () => number;
  /* Streaming (optional — required only for the user-data WebSocket). */
  readonly wsBaseUrl?: string;
  readonly socketFactory?: SocketFactory;
  readonly scheduler?: Scheduler;
  readonly random?: Random;
}

export class BinanceFuturesClient {
  readonly capabilities = new BinanceFuturesCapabilityRegistry();
  readonly metrics = new BinanceFuturesMetrics();
  readonly orders: BinanceFuturesOrderService;
  readonly positions: BinanceFuturesPositionService;
  readonly account: BinanceFuturesAccountService;
  readonly balances: BinanceFuturesBalanceService;
  readonly metadata: BinanceFuturesMetadataService;

  private readonly deps: BinanceFuturesClientDeps;
  private readonly resolver: SymbolResolver;
  private webSocketClient?: BinanceFuturesWebSocketClient;

  constructor(deps: BinanceFuturesClientDeps) {
    this.deps = deps;
    this.resolver = deps.resolver ?? IDENTITY_SYMBOL_RESOLVER;
    const clock = deps.clock ?? Date.now;

    this.positions = new BinanceFuturesPositionService({
      accountClient: deps.rest,
      configClient: deps.rest,
      resolver: this.resolver,
      capabilities: this.capabilities,
      metrics: this.metrics,
      clock,
    });
    this.orders = new BinanceFuturesOrderService({
      client: deps.rest,
      capabilities: this.capabilities,
      positionMode: () => this.positions.positionMode(),
      symbolInfo: deps.symbolInfo,
      exchangeSymbol: deps.exchangeSymbol,
      metrics: this.metrics,
      clock,
    });
    this.account = new BinanceFuturesAccountService({
      client: deps.rest,
      resolver: this.resolver,
      metrics: this.metrics,
      clock,
    });
    this.balances = new BinanceFuturesBalanceService({
      client: deps.rest,
      metrics: this.metrics,
      clock,
    });
    this.metadata = new BinanceFuturesMetadataService({
      marketDataClient: deps.rest,
      configClient: deps.rest,
      resolver: this.resolver,
      metrics: this.metrics,
      clock,
    });
  }

  /**
   * The Futures user-data WebSocket client (lazily created, memoized). Requires a socket factory and a
   * WebSocket base URL. Call `connect(listenKey)` on the returned client with a listen key obtained via
   * the Authentication & User Data Streams module.
   */
  webSocket(): BinanceFuturesWebSocketClient {
    if (!this.deps.socketFactory || !this.deps.wsBaseUrl)
      throw new BinanceFuturesUnsupportedError('user-data WebSocket (no socket factory injected)');
    if (!this.webSocketClient) {
      this.webSocketClient = new BinanceFuturesWebSocketClient({
        wsBaseUrl: this.deps.wsBaseUrl,
        factory: this.deps.socketFactory,
        scheduler: this.deps.scheduler,
        random: this.deps.random,
        resolver: this.resolver,
      });
    }
    return this.webSocketClient;
  }

  /** A point-in-time snapshot of Futures operation metrics. */
  metricsSnapshot(): FuturesMetricsSnapshot {
    return this.metrics.snapshot();
  }
}
