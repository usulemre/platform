/**
 * `BinanceOrderService` — the order-execution facade and single orchestration point for the Binance
 * order lifecycle. It validates a canonical request, builds the documented Binance parameters, invokes
 * the injected {@link BinanceOrderClient} (which reuses the resilient REST client), validates and parses
 * the response into a canonical order response, records metrics/health, and canonicalizes every error.
 * It exposes ONLY canonical models and enforces market capabilities (Spot vs Futures). It performs no
 * trading strategy, portfolio or risk logic — it only executes the order operation it is asked to.
 */
import { BinanceOrderCapabilities } from './capabilities';
import {
  BinanceOrderRequestBuilder,
  type OrderReference,
  type ReplaceOrderRequest,
} from './request-builder';
import { BinanceOrderResponseParser } from './response-parser';
import { BinanceOrderValidator } from './validator';
import { BinanceOrderErrorMapper } from './error-mapper';
import { BinanceOrderStatusMapper } from './status-mapper';
import { BinanceFillMapper } from './fill-mapper';
import { BinanceOrderUnsupportedError } from './errors';
import {
  OrderHealthMonitor,
  OrderMetrics,
  type OrderHealth,
  type OrderMetricsSnapshot,
  type OrderOperationKind,
} from './metrics';
import { BinanceMapper } from '../mappers/mapper';
import type { BinanceOrderClient } from './client';
import type { BinanceMarket } from '../constants';
import type { BinanceOrder, BinanceSymbolInfo } from '../types/binance';
import type { ExchangeSymbol } from '../metadata/types';
import type {
  CanonicalFill,
  CanonicalOrder,
  CanonicalOrderRequest,
  CanonicalOrderResponse,
} from './canonical';

export interface BinanceOrderServiceDeps {
  readonly market: BinanceMarket;
  readonly client: BinanceOrderClient;
  readonly clock?: () => number;
  /** Instrument metadata lookup (venue symbol → info) for canonical symbol naming. */
  readonly symbolInfo?: (venueSymbol: string) => BinanceSymbolInfo | undefined;
  /** Canonical instrument lookup (for trading-rule validation). */
  readonly exchangeSymbol?: (symbol: string) => ExchangeSymbol | undefined;
  readonly metrics?: OrderMetrics;
}

export class BinanceOrderService {
  readonly market: BinanceMarket;
  readonly capabilities: BinanceOrderCapabilities;
  readonly statusMapper = new BinanceOrderStatusMapper();
  private readonly client: BinanceOrderClient;
  private readonly builder: BinanceOrderRequestBuilder;
  private readonly parser: BinanceOrderResponseParser;
  private readonly validator: BinanceOrderValidator;
  private readonly errors = new BinanceOrderErrorMapper();
  private readonly fills = new BinanceFillMapper();
  private readonly metrics: OrderMetrics;
  private readonly health: OrderHealthMonitor;
  private readonly clock: () => number;
  private readonly deps: BinanceOrderServiceDeps;

  constructor(deps: BinanceOrderServiceDeps) {
    this.deps = deps;
    this.market = deps.market;
    this.clock = deps.clock ?? Date.now;
    this.capabilities = new BinanceOrderCapabilities(deps.market);
    this.client = deps.client;
    this.builder = new BinanceOrderRequestBuilder(deps.market);
    this.parser = new BinanceOrderResponseParser(new BinanceMapper(deps.market).orders);
    this.validator = new BinanceOrderValidator(this.capabilities);
    this.metrics = deps.metrics ?? new OrderMetrics();
    this.health = new OrderHealthMonitor({ clock: this.clock });
  }

  private info(venueSymbol: string): BinanceSymbolInfo | undefined {
    return this.deps.symbolInfo?.(venueSymbol);
  }

  /** Run an operation, recording metrics/health and canonicalizing errors. */
  private async run<T>(kind: OrderOperationKind, operation: () => Promise<T>): Promise<T> {
    try {
      const result = await operation();
      this.metrics.onOperation(kind, this.clock());
      this.health.record(true);
      return result;
    } catch (error) {
      const canonical = this.errors.map(error);
      if (canonical.category === 'ORDER_REJECTED') this.metrics.onReject();
      else this.metrics.onError();
      this.health.record(false);
      throw canonical;
    }
  }

  /* ------------------------------ operations ------------------------------ */

  /** Create an order; returns the canonical order response (order + fills + commissions). */
  createOrder(request: CanonicalOrderRequest): Promise<CanonicalOrderResponse> {
    this.validator.validateRequest(request, this.deps.exchangeSymbol?.(request.symbol));
    const params = this.builder.buildCreate(request);
    return this.run('create', async () => {
      const raw = this.validator.validateResponse(await this.client.createOrder(params));
      return this.parser.parse(raw, this.info(raw.symbol));
    });
  }

  /** Query a single order's current state. */
  getOrder(symbol: string, reference: OrderReference): Promise<CanonicalOrder> {
    const venue = this.builder.venueSymbol(symbol);
    return this.run('query', async () => {
      const raw = await this.client.queryOrder(venue, reference);
      return this.parser.parseOrder(raw, this.info(raw.symbol));
    });
  }

  /** Cancel a single order. */
  cancelOrder(symbol: string, reference: OrderReference): Promise<CanonicalOrder> {
    const venue = this.builder.venueSymbol(symbol);
    return this.run('cancel', async () => {
      const raw = await this.client.cancelOrder(venue, reference);
      return this.parser.parseOrder(raw, this.info(raw.symbol));
    });
  }

  /**
   * Cancel all open orders on a symbol. Spot returns the cancelled orders; Futures acknowledges the
   * bulk cancel without per-order detail (returns an empty canonical list).
   */
  cancelAllOrders(symbol: string): Promise<readonly CanonicalOrder[]> {
    const venue = this.builder.venueSymbol(symbol);
    return this.run('cancelAll', async () => {
      const result = await this.client.cancelAllOrders(venue);
      if (!Array.isArray(result)) return [];
      return (result as readonly BinanceOrder[])
        .filter((o) => typeof o.orderId === 'number')
        .map((o) => this.parser.parseOrder(o, this.info(o.symbol)));
    });
  }

  /**
   * Replace/modify a working order where officially supported: Spot uses the atomic `cancelReplace`,
   * Futures uses `PUT` modify. Returns the resulting canonical order response.
   */
  replaceOrder(request: ReplaceOrderRequest): Promise<CanonicalOrderResponse> {
    if (!this.capabilities.supportsOperation('REPLACE'))
      throw new BinanceOrderUnsupportedError('replace', this.market);
    this.validator.validateRequest(request, this.deps.exchangeSymbol?.(request.symbol));
    return this.run('replace', async () => {
      if (this.market === 'FUTURES') {
        const raw = this.validator.validateResponse(
          await this.client.modifyOrder(this.builder.buildModify(request)),
        );
        return this.parser.parse(raw, this.info(raw.symbol));
      }
      const response = await this.client.cancelReplaceOrder(
        this.builder.buildCancelReplace(request),
      );
      const parsed = this.parser.parseCancelReplace(response, undefined);
      if (!parsed) throw this.errors.map(new Error('cancelReplace returned no new order.'));
      return parsed;
    });
  }

  /** List open orders (optionally for a symbol) as canonical orders. */
  listOpenOrders(symbol?: string): Promise<readonly CanonicalOrder[]> {
    const venue = symbol ? this.builder.venueSymbol(symbol) : undefined;
    return this.run('query', async () => {
      const raw = await this.client.openOrders(venue);
      return raw.map((o) => this.parser.parseOrder(o, this.info(o.symbol)));
    });
  }

  /** List an order/symbol's fills (from account trades) as canonical fills. */
  listFills(symbol: string): Promise<readonly CanonicalFill[]> {
    const venue = this.builder.venueSymbol(symbol);
    return this.run('query', async () => {
      const trades = await this.client.myTrades(venue);
      return trades.map((t) => this.fills.fromUserTrade(t));
    });
  }

  /* ------------------------------ observability ------------------------------ */

  metricsSnapshot(): OrderMetricsSnapshot {
    return this.metrics.snapshot();
  }

  healthSnapshot(): OrderHealth {
    return this.health.evaluate();
  }
}
