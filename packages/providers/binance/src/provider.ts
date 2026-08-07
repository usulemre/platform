/**
 * `BinanceProvider` — the concrete Broker Gateway adapter for Binance (Spot) and Binance Futures. It
 * implements the SDK's {@link BrokerProviderPort} (the ONLY surface the gateway reaches a venue
 * through) and adds a typed, canonical trading/market-data surface on top. It composes the provider's
 * building blocks — resilient REST client, WebSocket client, authentication/signing, server-time sync,
 * exchange-info cache, mappers, health monitor and capability registry — behind one object, and it is
 * strictly isolated: it depends only on the shared foundations and the Broker Gateway SDK, never on
 * other platform modules, and it branches on venue specifics only inside this package.
 *
 * All dependencies (HTTP transport, socket factory, secret provider, clock, scheduler) are INJECTED;
 * nothing is constructed at build time and no IO happens until a capability is invoked. Runtime state
 * is keyed by `brokerId`, so one adapter instance safely serves multiple broker bindings of the same
 * provider id. JavaScript's single-threaded model makes the per-broker state transitions race-free.
 */
import {
  describeProvider,
  type AuthResult,
  type BalanceSnapshot,
  type BrokerCapabilityType,
  type BrokerHealth,
  type BrokerProviderPort,
  type BrokerStatus,
  type CapabilityContext,
  type HeartbeatResult,
  type OrderSyncRecord,
  type PositionSnapshot,
  type ProviderDescriptor,
  type ProviderId,
} from '@platform/broker-sdk';
import {
  FetchHttpTransport,
  type Clock,
  type HttpTransport,
  type Random,
  type Scheduler,
} from '@platform/http-client';
import { EnvSecretProvider, SignatureService, type SecretProvider } from '@platform/auth-core';
import type { SocketFactory } from '@platform/websocket-client';
import { BinanceAuthentication } from './auth/authentication';
import { MARKET_BY_PROVIDER, type BinanceMarket } from './constants';
import {
  resolveBinanceConfiguration,
  type BinanceConfigOverrides,
  type BinanceConfiguration,
} from './config';
import { BinanceCapabilityRegistry } from './capability-registry';
import { BinanceConfigurationError, BinanceErrorMapper } from './errors';
import { BinanceExchangeInfoCache } from './exchange-info';
import { BinanceHealthMonitor } from './health-monitor';
import { BinanceMapper } from './mappers/mapper';
import { BinanceServerTimeSync } from './time-sync';
import { BinanceRestClient } from './http/rest-client';
import { createResilientHttpClient, type ResilientHttpClient } from './http/resilience';
import { ExchangeMetadataService } from './metadata/service';
import { BinanceWebSocketClient } from './ws/websocket-client';
import type {
  CanonicalOrder,
  CanonicalOrderRequest,
  CanonicalOrderBook,
  CanonicalKline,
  CanonicalSymbol,
  CanonicalTrade,
} from './types/canonical';

export interface BinanceProviderDeps {
  readonly providerId?: ProviderId;
  /** HTTP transport for the REST client (defaults to a Fetch transport, created lazily). */
  readonly transport?: HttpTransport;
  /** Socket factory for the WebSocket client (required for streaming). */
  readonly socketFactory?: SocketFactory;
  /** Secret provider resolving credential references (defaults to an empty env provider — fail-closed). */
  readonly secretProvider?: SecretProvider;
  readonly signatureService?: SignatureService;
  readonly clock?: Clock;
  readonly scheduler?: Scheduler;
  readonly random?: Random;
  readonly configOverrides?: BinanceConfigOverrides;
  /** Environment map for the default env secret provider (injected, never read ambiently). */
  readonly env?: Readonly<Record<string, string | undefined>>;
  /** Provider request-rate policy override. */
  readonly rateLimit?: { readonly limit: number; readonly intervalMs: number };
}

interface BrokerRuntime {
  readonly config: BinanceConfiguration;
  readonly resilient: ResilientHttpClient;
  readonly rest: BinanceRestClient;
  readonly timeSync: BinanceServerTimeSync;
  readonly exchangeInfo: BinanceExchangeInfoCache;
  readonly health: BinanceHealthMonitor;
  metadata?: ExchangeMetadataService;
  connected: boolean;
}

export class BinanceProvider implements BrokerProviderPort {
  readonly descriptor: ProviderDescriptor;
  readonly market: BinanceMarket;
  readonly capabilityRegistry: BinanceCapabilityRegistry;
  readonly mapper: BinanceMapper;

  private readonly providerId: ProviderId;
  private readonly deps: BinanceProviderDeps;
  private readonly auth: BinanceAuthentication;
  private readonly errors = new BinanceErrorMapper();
  private readonly clock: Clock;
  private readonly runtimes = new Map<string, BrokerRuntime>();
  private transportInstance?: HttpTransport;

  constructor(deps: BinanceProviderDeps = {}) {
    this.providerId = deps.providerId ?? 'binance';
    const market = MARKET_BY_PROVIDER[this.providerId as keyof typeof MARKET_BY_PROVIDER];
    if (!market)
      throw new BinanceConfigurationError(
        `@platform/provider-binance does not serve provider "${this.providerId}".`,
      );
    this.market = market;
    this.deps = deps;
    this.clock = deps.clock ?? Date.now;
    // Reflect reality: this adapter is a live implementation, not a placeholder.
    this.descriptor = { ...describeProvider(this.providerId), placeholder: false };
    this.capabilityRegistry = new BinanceCapabilityRegistry(this.providerId);
    this.mapper = new BinanceMapper(market);
    this.auth = new BinanceAuthentication({
      secretProvider: deps.secretProvider ?? new EnvSecretProvider(deps.env ?? {}, 'SECRET_'),
      signatureService: deps.signatureService ?? new SignatureService(),
    });
  }

  /* ------------------------------ capability declaration ------------------------------ */

  capabilities(): readonly BrokerCapabilityType[] {
    return this.capabilityRegistry.list();
  }

  supports(capability: BrokerCapabilityType): boolean {
    return this.capabilityRegistry.supports(capability);
  }

  /* ------------------------------ runtime composition ------------------------------ */

  private transport(): HttpTransport {
    if (this.deps.transport) return this.deps.transport;
    if (!this.transportInstance) {
      try {
        this.transportInstance = new FetchHttpTransport();
      } catch {
        throw new BinanceConfigurationError(
          'No HTTP transport was injected and no Fetch implementation is available.',
        );
      }
    }
    return this.transportInstance;
  }

  /** Build (or reuse) the per-broker runtime for a capability context. */
  private runtime(ctx: CapabilityContext): BrokerRuntime {
    const config = resolveBinanceConfiguration(ctx.config, this.deps.configOverrides);
    if (ctx.config.providerId !== this.providerId)
      throw new BinanceConfigurationError(
        `Broker "${config.brokerId}" is bound to "${ctx.config.providerId}", not "${this.providerId}".`,
      );
    const cached = this.runtimes.get(config.brokerId);
    if (cached && cached.config.restBaseUrl === config.restBaseUrl) return cached;

    const resilient = createResilientHttpClient({
      transport: this.transport(),
      clock: this.clock,
      scheduler: this.deps.scheduler,
      random: this.deps.random,
      rateLimit: this.deps.rateLimit,
    });
    const timeSync = new BinanceServerTimeSync({ clock: this.clock, ttlMs: config.timeSyncTtlMs });
    const exchangeInfo = new BinanceExchangeInfoCache({
      clock: this.clock,
      ttlMs: config.exchangeInfoTtlMs,
    });
    const rest = new BinanceRestClient({
      config,
      http: resilient.http,
      auth: this.auth,
      timestamp: () => timeSync.now(),
      errorMapper: this.errors,
    });
    const health = new BinanceHealthMonitor({
      brokerId: config.brokerId,
      clock: this.clock,
      heartbeatIntervalMs: config.heartbeatIntervalMs,
    });
    const runtime: BrokerRuntime = {
      config,
      resilient,
      rest,
      timeSync,
      exchangeInfo,
      health,
      connected: false,
    };
    this.runtimes.set(config.brokerId, runtime);
    return runtime;
  }

  /* ------------------------------ connectivity ------------------------------ */

  async authenticate(ctx: CapabilityContext): Promise<AuthResult> {
    const runtime = this.runtime(ctx);
    if (!this.auth.isConfigured(runtime.config))
      throw new BinanceConfigurationError(
        `Broker "${runtime.config.brokerId}" is missing API key/secret references; cannot authenticate.`,
      );
    // Binance uses stateless API keys; align the clock so subsequent signed calls are accepted.
    await runtime.timeSync.sync(() => runtime.rest.serverTime());
    return { tokenRef: runtime.config.credentialRef };
  }

  async connect(ctx: CapabilityContext): Promise<void> {
    const runtime = this.runtime(ctx);
    const startedAt = this.clock();
    await runtime.rest.ping();
    await runtime.timeSync.sync(() => runtime.rest.serverTime());
    await runtime.exchangeInfo.ensure(() => runtime.rest.exchangeInfo());
    runtime.connected = true;
    runtime.health.recordHeartbeat(this.clock() - startedAt);
  }

  async disconnect(ctx: CapabilityContext): Promise<void> {
    const runtime = this.runtimes.get(ctx.brokerId);
    if (runtime) runtime.connected = false;
  }

  async heartbeat(ctx: CapabilityContext): Promise<HeartbeatResult> {
    const runtime = this.runtime(ctx);
    const startedAt = this.clock();
    try {
      await runtime.rest.ping();
      const latencyMs = this.clock() - startedAt;
      runtime.health.recordHeartbeat(latencyMs);
      return { at: new Date(this.clock()).toISOString(), latencyMs };
    } catch (error) {
      runtime.health.recordError();
      throw this.errors.map(error);
    }
  }

  /* ------------------------------ account synchronization (port) ------------------------------ */

  async queryPositions(ctx: CapabilityContext): Promise<readonly PositionSnapshot[]> {
    const runtime = this.runtime(ctx);
    if (runtime.config.market !== 'FUTURES') return [];
    return this.observe(runtime, async () => {
      const positions = await runtime.rest.positionRisk();
      return this.mapper.positions.fromPositionRiskMany(positions);
    });
  }

  async queryBalances(ctx: CapabilityContext): Promise<readonly BalanceSnapshot[]> {
    const runtime = this.runtime(ctx);
    return this.observe(runtime, async () => {
      if (runtime.config.market === 'FUTURES') {
        return this.mapper.balances.fromFuturesMany(await runtime.rest.futuresBalances());
      }
      return this.mapper.balances.fromSpotMany(await runtime.rest.spotBalances());
    });
  }

  async queryOrders(ctx: CapabilityContext): Promise<readonly OrderSyncRecord[]> {
    const runtime = this.runtime(ctx);
    return this.observe(runtime, async () => {
      const orders = await runtime.rest.openOrders();
      return orders.map((order) =>
        this.mapper.orders.toSyncRecord(order, runtime.exchangeInfo.get(order.symbol)),
      );
    });
  }

  /* ------------------------------ trading (canonical surface) ------------------------------ */

  /** Submit a canonical order; returns the canonical order as acknowledged by the venue. */
  async submitOrder(
    ctx: CapabilityContext,
    request: CanonicalOrderRequest,
  ): Promise<CanonicalOrder> {
    const runtime = this.runtime(ctx);
    return this.observe(runtime, async () => {
      const params = this.mapper.orders.toBinanceParams(request);
      const order = await runtime.rest.newOrder(params);
      return this.mapper.orders.toCanonical(order, runtime.exchangeInfo.get(order.symbol));
    });
  }

  /** Cancel a working order by venue order id or client order id. */
  async cancelOrder(
    ctx: CapabilityContext,
    canonicalSymbol: string,
    ref: { orderId?: number; clientOrderId?: string },
  ): Promise<CanonicalOrder> {
    const runtime = this.runtime(ctx);
    const binanceSymbol = this.mapper.symbols.toBinance(canonicalSymbol);
    return this.observe(runtime, async () => {
      const order = await runtime.rest.cancelOrder(binanceSymbol, ref);
      return this.mapper.orders.toCanonical(order, runtime.exchangeInfo.get(order.symbol));
    });
  }

  /** Query a single order's current state. */
  async getOrder(
    ctx: CapabilityContext,
    canonicalSymbol: string,
    ref: { orderId?: number; clientOrderId?: string },
  ): Promise<CanonicalOrder> {
    const runtime = this.runtime(ctx);
    const binanceSymbol = this.mapper.symbols.toBinance(canonicalSymbol);
    return this.observe(runtime, async () => {
      const order = await runtime.rest.queryOrder(binanceSymbol, ref);
      return this.mapper.orders.toCanonical(order, runtime.exchangeInfo.get(order.symbol));
    });
  }

  /** List canonical trades (fills) for a symbol. */
  async listTrades(
    ctx: CapabilityContext,
    canonicalSymbol: string,
  ): Promise<readonly CanonicalTrade[]> {
    const runtime = this.runtime(ctx);
    const binanceSymbol = this.mapper.symbols.toBinance(canonicalSymbol);
    return this.observe(runtime, async () => {
      const trades = await runtime.rest.myTrades(binanceSymbol);
      return this.mapper.trades.toCanonicalMany(trades, runtime.exchangeInfo.get(binanceSymbol));
    });
  }

  /* ------------------------------ market data (canonical surface) ------------------------------ */

  /** Canonical order-book snapshot for a symbol. */
  async getOrderBook(
    ctx: CapabilityContext,
    canonicalSymbol: string,
    limit = 100,
  ): Promise<CanonicalOrderBook> {
    const runtime = this.runtime(ctx);
    const binanceSymbol = this.mapper.symbols.toBinance(canonicalSymbol);
    return this.observe(runtime, async () => {
      const depth = await runtime.rest.orderBook(binanceSymbol, limit);
      return this.mapper.marketData.depthToOrderBook(
        binanceSymbol,
        depth,
        runtime.exchangeInfo.get(binanceSymbol),
      );
    });
  }

  /** Canonical klines for a symbol/interval. */
  async getKlines(
    ctx: CapabilityContext,
    canonicalSymbol: string,
    interval: string,
    limit = 500,
  ): Promise<readonly CanonicalKline[]> {
    const runtime = this.runtime(ctx);
    const binanceSymbol = this.mapper.symbols.toBinance(canonicalSymbol);
    return this.observe(runtime, async () => {
      const rows = await runtime.rest.klines(binanceSymbol, interval, limit);
      const info = runtime.exchangeInfo.get(binanceSymbol);
      return rows.map((row) => this.mapper.marketData.klineRow(binanceSymbol, interval, row, info));
    });
  }

  /** The canonical instrument catalog (from the exchange-info cache; loads it if empty). */
  async symbols(ctx: CapabilityContext): Promise<readonly CanonicalSymbol[]> {
    const runtime = this.runtime(ctx);
    await runtime.exchangeInfo.ensure(() => runtime.rest.exchangeInfo());
    return runtime.exchangeInfo.all().map((info) => this.mapper.symbols.toCanonical(info));
  }

  /**
   * The Exchange Metadata & Symbol Registry for this broker binding — the canonical single source of
   * truth for Binance symbols (Phase 9.1.1). Lazily created and memoized per broker runtime; backed by
   * the same resilient REST client, so it discovers through the Common HTTP Client. Call
   * `ensureFresh()`/`refresh()` on the returned service to populate it.
   */
  metadataService(ctx: CapabilityContext): ExchangeMetadataService {
    const runtime = this.runtime(ctx);
    if (!runtime.metadata) {
      runtime.metadata = new ExchangeMetadataService({
        market: runtime.config.market,
        source: runtime.rest,
        clock: this.clock,
        ttlMs: runtime.config.exchangeInfoTtlMs,
      });
    }
    return runtime.metadata;
  }

  /* ------------------------------ streaming & introspection ------------------------------ */

  /** Construct a Binance WebSocket client bound to this broker's runtime (requires a socket factory). */
  webSocket(ctx: CapabilityContext): BinanceWebSocketClient {
    const runtime = this.runtime(ctx);
    if (!this.deps.socketFactory)
      throw new BinanceConfigurationError(
        'No socket factory was injected; streaming is unavailable.',
      );
    return new BinanceWebSocketClient({
      config: runtime.config,
      mapper: this.mapper,
      factory: this.deps.socketFactory,
      scheduler: this.deps.scheduler,
      random: this.deps.random,
      exchangeInfo: runtime.exchangeInfo,
    });
  }

  /** Start a user-data stream: obtain a listen key via REST, then open the stream over WS. */
  async openUserDataStream(
    ctx: CapabilityContext,
    handlers: import('./ws/websocket-client').UserDataHandlers,
  ): Promise<{ listenKey: string; ws: import('@platform/websocket-client').WebSocketClient }> {
    const runtime = this.runtime(ctx);
    const listenKey = await runtime.rest.startUserDataStream();
    const ws = this.webSocket(ctx).openUserDataStream(listenKey, handlers);
    return { listenKey, ws };
  }

  /** The current computed broker health for a lifecycle status. */
  health(ctx: CapabilityContext, status: BrokerStatus = 'HEALTHY'): BrokerHealth {
    return this.runtime(ctx).health.snapshot(status);
  }

  /** Whether this broker binding has resolvable credentials (does not touch the network). */
  isConfigured(ctx: CapabilityContext): boolean {
    return this.auth.isConfigured(this.runtime(ctx).config);
  }

  /* ------------------------------ helpers ------------------------------ */

  /** Run an operation, recording success/failure on the health monitor and canonicalizing errors. */
  private async observe<T>(runtime: BrokerRuntime, operation: () => Promise<T>): Promise<T> {
    const startedAt = this.clock();
    try {
      const result = await operation();
      runtime.health.recordSuccess(this.clock() - startedAt);
      return result;
    } catch (error) {
      runtime.health.recordError();
      throw this.errors.map(error);
    }
  }
}
