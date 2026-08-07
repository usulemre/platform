/**
 * `UserDataStream` — the authenticated user data stream: it obtains a listen key, opens an
 * authenticated WebSocket to `<wsBase>/ws/<listenKey>`, keeps the key alive, maps every raw event to a
 * canonical account event, and recovers the session on a `listenKeyExpired` event by re-authenticating
 * with a fresh key. It composes the listen-key manager/refresher, the authenticated WS client, the
 * event mapper/validator, the authentication state manager and metrics/health. It exposes ONLY
 * canonical account events; it never places orders. Every side effect (transport, timers, clock) is
 * injected, so behaviour is deterministic under a manual scheduler.
 *
 * Thread-safety: JavaScript is single-threaded; state transitions and dispatch happen synchronously
 * without interleaving awaits, so listeners always observe a consistent stream state.
 */
import type { Random, Scheduler } from '@platform/http-client';
import { AuthenticationEventMapper } from './event-mapper';
import { AuthenticationValidator } from './validator';
import { ListenKeyManager } from './listen-key-manager';
import { ListenKeyRefresher } from './listen-key-refresher';
import { AuthenticatedWebSocketClient } from './ws-client';
import { UserDataHealthMonitor, UserDataMetrics } from './metrics';
import type { AuthenticationStateManager } from './state';
import type { AuthenticatedRestClient } from './rest';
import type { SymbolResolver } from '../websocket/event-mapper';
import type { BinanceMarket } from '../constants';
import type {
  AccountEvent,
  AccountUpdatedEvent,
  BalanceUpdatedEvent,
  ExecutionReportEvent,
  ListenKeyExpiredEvent,
  OrderUpdatedEvent,
  PositionUpdatedEvent,
  TradeExecutionEvent,
} from './events';

/** Canonical event kind → event type, for typed subscriptions. */
export interface AccountEventMap {
  accountUpdated: AccountUpdatedEvent;
  balanceUpdated: BalanceUpdatedEvent;
  positionUpdated: PositionUpdatedEvent;
  orderUpdated: OrderUpdatedEvent;
  executionReport: ExecutionReportEvent;
  tradeExecution: TradeExecutionEvent;
  listenKeyExpired: ListenKeyExpiredEvent;
}

export interface UserDataStreamDeps {
  readonly market: BinanceMarket;
  readonly wsBaseUrl: string;
  readonly rest: AuthenticatedRestClient;
  readonly factory: import('@platform/websocket-client').SocketFactory;
  readonly stateManager: AuthenticationStateManager;
  readonly clock: () => number;
  readonly scheduler: Scheduler;
  readonly random?: Random;
  readonly resolver?: SymbolResolver;
  readonly keepAliveIntervalMs?: number;
  readonly reconnectMaxAttempts?: number;
  readonly stalenessMs?: number;
  /** Fetch an account snapshot on (re)connect to recover state. Default true. */
  readonly recoverOnReconnect?: boolean;
  readonly onError?: (error: Error) => void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class UserDataStream {
  readonly market: BinanceMarket;
  private readonly deps: UserDataStreamDeps;
  private readonly manager: ListenKeyManager;
  private readonly refresher: ListenKeyRefresher;
  private readonly mapper: AuthenticationEventMapper;
  private readonly validator = new AuthenticationValidator();
  private readonly metrics = new UserDataMetrics();
  private readonly healthMonitor: UserDataHealthMonitor;
  private readonly state: AuthenticationStateManager;
  private readonly handlers = new Map<string, Set<(event: AccountEvent) => void>>();
  private readonly anyHandlers = new Set<(event: AccountEvent) => void>();
  private ws?: AuthenticatedWebSocketClient;
  private wsUnsub: (() => void)[] = [];
  private running = false;

  constructor(deps: UserDataStreamDeps) {
    this.deps = deps;
    this.market = deps.market;
    this.state = deps.stateManager;
    this.manager = new ListenKeyManager({ rest: deps.rest, clock: deps.clock });
    this.refresher = new ListenKeyRefresher({
      manager: this.manager,
      scheduler: deps.scheduler,
      intervalMs: deps.keepAliveIntervalMs,
      callbacks: {
        onKeepAlive: () => this.metrics.onKeepAlive(),
        onRecreate: (key) => {
          this.metrics.onKeyRecreation();
          void this.rebuildConnection(key);
        },
        onError: (error) => this.fail(error),
      },
    });
    this.mapper = new AuthenticationEventMapper(deps.market, deps.resolver);
    this.healthMonitor = new UserDataHealthMonitor({
      clock: deps.clock,
      stalenessMs: deps.stalenessMs ?? 90_000,
    });
  }

  /* ------------------------------ subscriptions ------------------------------ */

  /** Subscribe to a canonical account event kind; returns an unsubscribe handle. */
  on<K extends keyof AccountEventMap>(
    kind: K,
    handler: (event: AccountEventMap[K]) => void,
  ): () => void {
    let set = this.handlers.get(kind);
    if (!set) {
      set = new Set();
      this.handlers.set(kind, set);
    }
    const typed = handler as (event: AccountEvent) => void;
    set.add(typed);
    return () => set!.delete(typed);
  }

  /** Subscribe to every canonical account event; returns an unsubscribe handle. */
  onAny(handler: (event: AccountEvent) => void): () => void {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  /* ------------------------------ lifecycle ------------------------------ */

  /** The current authentication state. */
  get authState(): AuthenticationStateManager['state'] {
    return this.state.state;
  }

  /** Whether the underlying socket is connected. */
  get connected(): boolean {
    return this.ws?.connected ?? false;
  }

  /** The active listen key (undefined until started). */
  get listenKey(): string | undefined {
    return this.manager.key;
  }

  /** Open the stream: authenticate, create a listen key, connect, and start keep-alives. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.state.transition('AUTHENTICATING', 'user-data-start');
    try {
      const key = await this.manager.ensure();
      this.openConnection(key);
      await this.ws!.connect();
      this.refresher.start();
      this.state.transition('AUTHENTICATED', 'user-data-ready');
      if (this.deps.recoverOnReconnect !== false) await this.recover();
    } catch (error) {
      this.fail(error as Error);
      throw error;
    }
  }

  /** Close the stream: stop keep-alives, close the socket and the listen key. */
  async stop(): Promise<void> {
    this.running = false;
    this.refresher.stop();
    this.teardownConnection();
    await this.manager.close().catch(() => undefined);
    this.state.transition('CLOSED', 'user-data-stop');
  }

  /* ------------------------------ observability ------------------------------ */

  metricsSnapshot() {
    return this.metrics.snapshot();
  }

  health() {
    return this.healthMonitor.evaluate(
      this.state.state,
      this.connected,
      this.metrics.snapshot().listenKeyExpiries,
    );
  }

  /* ------------------------------ connection management ------------------------------ */

  private openConnection(listenKey: string): void {
    this.ws = new AuthenticatedWebSocketClient({
      url: `${this.deps.wsBaseUrl}/ws/${listenKey}`,
      factory: this.deps.factory,
      scheduler: this.deps.scheduler,
      random: this.deps.random,
      reconnectMaxAttempts: this.deps.reconnectMaxAttempts,
    });
    this.wsUnsub = [
      this.ws.onMessage((message) => this.handleRaw(message)),
      this.ws.on('reconnected', () => {
        this.metrics.onReconnect();
        if (this.deps.recoverOnReconnect !== false) void this.recover();
      }),
      this.ws.on('error', ({ error }) => this.deps.onError?.(error as unknown as Error)),
    ];
  }

  private teardownConnection(): void {
    for (const off of this.wsUnsub) off();
    this.wsUnsub = [];
    this.ws?.close();
    this.ws = undefined;
  }

  /** Rebuild the socket around a new listen key (after expiry/recreation). */
  private async rebuildConnection(listenKey: string): Promise<void> {
    if (!this.running) return;
    this.teardownConnection();
    this.openConnection(listenKey);
    try {
      await this.ws!.connect();
      this.state.transition('AUTHENTICATED', 'reauthenticated');
      if (this.deps.recoverOnReconnect !== false) await this.recover();
    } catch (error) {
      this.fail(error as Error);
    }
  }

  /* ------------------------------ event handling ------------------------------ */

  private handleRaw(message: unknown): void {
    if (!isObject(message)) return;
    const type = message['e'];
    try {
      switch (type) {
        case 'outboundAccountPosition':
          this.dispatch(
            this.mapper.outboundAccountPosition(this.validator.outboundAccountPosition(message)),
          );
          break;
        case 'balanceUpdate':
          this.dispatch(this.mapper.balanceUpdate(this.validator.balanceUpdate(message)));
          break;
        case 'executionReport': {
          const bundle = this.mapper.executionReport(this.validator.executionReport(message));
          this.dispatch(bundle.order);
          this.dispatch(bundle.report);
          if (bundle.trade) this.dispatch(bundle.trade);
          break;
        }
        case 'ACCOUNT_UPDATE': {
          const { account, positions } = this.mapper.futuresAccountUpdate(
            this.validator.futuresAccountUpdate(message),
          );
          this.dispatch(account);
          for (const position of positions) this.dispatch(position);
          break;
        }
        case 'ORDER_TRADE_UPDATE': {
          const bundle = this.mapper.futuresOrderTradeUpdate(
            this.validator.futuresOrderTradeUpdate(message),
          );
          this.dispatch(bundle.order);
          this.dispatch(bundle.report);
          if (bundle.trade) this.dispatch(bundle.trade);
          break;
        }
        case 'listenKeyExpired':
          this.handleListenKeyExpired(
            this.mapper.listenKeyExpired(this.validator.listenKeyExpired(message)),
          );
          break;
        default:
          break; // Undocumented/unsupported event types are ignored.
      }
    } catch (error) {
      this.metrics.onError();
      this.deps.onError?.(error as Error);
    }
  }

  private handleListenKeyExpired(event: ListenKeyExpiredEvent): void {
    this.metrics.onListenKeyExpiry();
    this.state.transition('EXPIRED', 'listen-key-expired');
    this.dispatch(event);
    this.state.transition('REAUTHENTICATING', 'listen-key-expired');
    this.manager.markExpired();
    void this.reauthenticate();
  }

  private async reauthenticate(): Promise<void> {
    if (!this.running) return;
    try {
      const key = await this.manager.create();
      this.metrics.onKeyRecreation();
      await this.rebuildConnection(key);
    } catch (error) {
      this.fail(error as Error);
    }
  }

  /** Session recovery: fetch an account snapshot and emit it as an AccountUpdatedEvent. */
  private async recover(): Promise<void> {
    if (this.market !== 'SPOT') return; // Spot account snapshot; futures recovers via ACCOUNT_UPDATE.
    try {
      const account = await this.deps.rest.account();
      const event: AccountUpdatedEvent = {
        kind: 'accountUpdated',
        market: this.market,
        balances: account.balances.map((b) => ({
          asset: b.asset,
          free: Number(b.free),
          locked: Number(b.locked),
        })),
        positions: [],
        eventTime: this.deps.clock(),
      };
      this.dispatch(event);
    } catch (error) {
      this.deps.onError?.(error as Error);
    }
  }

  private dispatch(event: AccountEvent): void {
    this.metrics.onEvent(event.kind, this.deps.clock());
    this.healthMonitor.recordEvent();
    for (const handler of this.handlers.get(event.kind) ?? []) handler(event);
    for (const handler of this.anyHandlers) handler(event);
  }

  private fail(error: Error): void {
    this.metrics.onError();
    this.state.transition('FAILED', error.message);
    this.deps.onError?.(error);
  }
}
