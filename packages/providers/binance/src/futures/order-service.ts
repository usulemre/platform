/**
 * `BinanceFuturesOrderService` — the USDⓈ-M Futures order-execution facade and single orchestration
 * point for the Futures order lifecycle. It validates a canonical Futures request (honouring the
 * account's position mode), builds the documented Futures parameters, invokes the injected
 * {@link FuturesTradingClient} (which reuses the resilient, signed REST client), validates and maps the
 * response into the canonical Futures order domain, records metrics/health, and canonicalizes every
 * error. It exposes ONLY canonical models and executes orders only — no trading strategy, portfolio or
 * risk logic.
 */
import { BinanceFuturesCapabilityRegistry } from './capability-registry';
import { BinanceFuturesRequestBuilder, type FuturesModifyRequest } from './request-builder';
import { BinanceFuturesValidator } from './validator';
import { BinanceFuturesErrorMapper } from './error-mapper';
import { BinanceFuturesOrderMapper } from './order-mapper';
import { BinanceFuturesMetrics, FuturesHealthMonitor, type FuturesHealth } from './metrics';
import { BinanceFillMapper } from '../orders/fill-mapper';
import type { OrderReference } from '../orders/request-builder';
import type { CanonicalFill } from '../orders/canonical';
import type { FuturesTradingClient } from './client';
import type { BinanceSymbolInfo } from '../types/binance';
import type { ExchangeSymbol } from '../metadata/types';
import type { FuturesMetricsSnapshot } from './metrics';
import type {
  FuturesOrder,
  FuturesOrderRequest,
  FuturesOrderResponse,
  FuturesPositionMode,
} from './types';

export interface BinanceFuturesOrderServiceDeps {
  readonly client: FuturesTradingClient;
  readonly orderMapper?: BinanceFuturesOrderMapper;
  readonly validator?: BinanceFuturesValidator;
  readonly capabilities?: BinanceFuturesCapabilityRegistry;
  /** The account's current position mode (drives hedge/one-way validation). Default `ONE_WAY`. */
  readonly positionMode?: () => FuturesPositionMode;
  /** Instrument metadata lookup (venue symbol → info) for canonical symbol naming. */
  readonly symbolInfo?: (venueSymbol: string) => BinanceSymbolInfo | undefined;
  /** Canonical instrument lookup (for trading-rule validation). */
  readonly exchangeSymbol?: (symbol: string) => ExchangeSymbol | undefined;
  readonly metrics?: BinanceFuturesMetrics;
  readonly clock?: () => number;
}

/** The acknowledgement of a bulk cancel-all on a symbol. */
export interface FuturesCancelAllResult {
  readonly acknowledged: boolean;
}

export class BinanceFuturesOrderService {
  readonly capabilities: BinanceFuturesCapabilityRegistry;
  private readonly client: FuturesTradingClient;
  private readonly builder = new BinanceFuturesRequestBuilder();
  private readonly orderMapper: BinanceFuturesOrderMapper;
  private readonly validator: BinanceFuturesValidator;
  private readonly fills = new BinanceFillMapper();
  private readonly errors = new BinanceFuturesErrorMapper();
  private readonly metrics: BinanceFuturesMetrics;
  private readonly health: FuturesHealthMonitor;
  private readonly clock: () => number;
  private readonly deps: BinanceFuturesOrderServiceDeps;

  constructor(deps: BinanceFuturesOrderServiceDeps) {
    this.deps = deps;
    this.client = deps.client;
    this.capabilities = deps.capabilities ?? new BinanceFuturesCapabilityRegistry();
    this.orderMapper = deps.orderMapper ?? new BinanceFuturesOrderMapper();
    this.validator = deps.validator ?? new BinanceFuturesValidator(this.capabilities);
    this.metrics = deps.metrics ?? new BinanceFuturesMetrics();
    this.clock = deps.clock ?? Date.now;
    this.health = new FuturesHealthMonitor({ clock: this.clock });
  }

  private info(venueSymbol: string): BinanceSymbolInfo | undefined {
    return this.deps.symbolInfo?.(venueSymbol);
  }

  private positionMode(): FuturesPositionMode {
    return this.deps.positionMode?.() ?? 'ONE_WAY';
  }

  /** Run an operation, recording metrics/health and canonicalizing errors. */
  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      const result = await operation();
      this.metrics.onOperation('order', this.clock());
      this.health.record(true);
      return result;
    } catch (error) {
      const canonical = this.errors.toCanonical(error);
      if (canonical.category === 'REJECTED') this.metrics.onReject();
      else this.metrics.onError();
      this.health.record(false);
      throw canonical;
    }
  }

  /* ------------------------------ operations ------------------------------ */

  /** Create a Futures order; returns the canonical order response (Futures returns no create fills). */
  createOrder(request: FuturesOrderRequest): Promise<FuturesOrderResponse> {
    return this.run(async () => {
      this.validator.validateOrder(
        request,
        this.positionMode(),
        this.deps.exchangeSymbol?.(request.symbol),
      );
      const params = this.builder.buildCreate(request);
      const raw = this.validator.validateResponse(await this.client.createOrder(params));
      return this.orderMapper.toResponse(raw, this.info(raw.symbol));
    });
  }

  /** Query a single order's current state. */
  getOrder(symbol: string, reference: OrderReference): Promise<FuturesOrder> {
    const venue = this.builder.venueSymbol(symbol);
    return this.run(async () => {
      const raw = await this.client.queryOrder(venue, reference);
      return this.orderMapper.toCanonical(raw, this.info(raw.symbol));
    });
  }

  /** Cancel a single order. */
  cancelOrder(symbol: string, reference: OrderReference): Promise<FuturesOrder> {
    const venue = this.builder.venueSymbol(symbol);
    return this.run(async () => {
      const raw = await this.client.cancelOrder(venue, reference);
      return this.orderMapper.toCanonical(raw, this.info(raw.symbol));
    });
  }

  /** Cancel all open orders on a symbol (Futures returns a `{ code, msg }` acknowledgement). */
  cancelAllOrders(symbol: string): Promise<FuturesCancelAllResult> {
    const venue = this.builder.venueSymbol(symbol);
    return this.run(async () => {
      const ack = await this.client.cancelAllOrders(venue);
      return { acknowledged: ack.code === 200 };
    });
  }

  /** Modify (amend price/quantity of) a working order via `PUT /fapi/v1/order`. */
  modifyOrder(request: FuturesModifyRequest): Promise<FuturesOrderResponse> {
    const params = this.builder.buildModify(request);
    return this.run(async () => {
      const raw = this.validator.validateResponse(await this.client.modifyOrder(params));
      return this.orderMapper.toResponse(raw, this.info(raw.symbol));
    });
  }

  /** List open orders (optionally for a symbol) as canonical Futures orders. */
  listOpenOrders(symbol?: string): Promise<readonly FuturesOrder[]> {
    const venue = symbol ? this.builder.venueSymbol(symbol) : undefined;
    return this.run(async () => {
      const raw = await this.client.openOrders(venue);
      return raw.map((o) => this.orderMapper.toCanonical(o, this.info(o.symbol)));
    });
  }

  /** List a symbol's fills (from user trades) as canonical fills. */
  listFills(symbol: string): Promise<readonly CanonicalFill[]> {
    const venue = this.builder.venueSymbol(symbol);
    return this.run(async () => {
      const trades = await this.client.userTrades(venue);
      return trades.map((t) => this.fills.fromUserTrade(t));
    });
  }

  /* ------------------------------ observability ------------------------------ */

  metricsSnapshot(): FuturesMetricsSnapshot {
    return this.metrics.snapshot();
  }

  healthSnapshot(): FuturesHealth {
    return this.health.evaluate();
  }
}
