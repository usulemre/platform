/**
 * `BinanceFuturesWebSocketClient` — the USDⓈ-M Futures user-data WebSocket client. Given a listen key
 * (obtained via the Authentication & User Data Streams module), it opens an authenticated socket to
 * `<wsBase>/ws/<listenKey>` over the reused {@link AuthenticatedWebSocketClient}, routes each raw frame
 * through the reused {@link AuthenticationValidator} (shared events) and the {@link BinanceFuturesEventMapper}
 * (Futures-only events), and emits canonical Futures events to typed subscribers. It re-emits a
 * reconnection signal so consumers can reload an authoritative snapshot across a gap. All transport is
 * INJECTED (socket factory, scheduler); it opens no real network by itself and never places orders.
 *
 * Thread-safety: JavaScript is single-threaded; routing and dispatch happen synchronously without
 * interleaving awaits, so subscribers always observe a consistent event order.
 */
import type { Random, Scheduler } from '@platform/http-client';
import type { SocketFactory } from '@platform/websocket-client';
import { AuthenticatedWebSocketClient } from '../auth/ws-client';
import { AuthenticationValidator } from '../auth/validator';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import { BinanceFuturesEventMapper } from './event-mapper';
import type { BinanceFuturesAccountConfigUpdate, BinanceFuturesMarginCall } from './binance-events';
import type { FuturesEventMap, FuturesUserEvent } from './events';

export interface BinanceFuturesWebSocketClientDeps {
  readonly wsBaseUrl: string;
  readonly factory: SocketFactory;
  readonly scheduler?: Scheduler;
  readonly random?: Random;
  readonly resolver?: SymbolResolver;
  readonly reconnectMaxAttempts?: number;
  readonly onError?: (error: Error) => void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class BinanceFuturesWebSocketClient {
  private readonly deps: BinanceFuturesWebSocketClientDeps;
  private readonly validator = new AuthenticationValidator();
  private readonly mapper: BinanceFuturesEventMapper;
  private readonly handlers = new Map<string, Set<(event: FuturesUserEvent) => void>>();
  private readonly anyHandlers = new Set<(event: FuturesUserEvent) => void>();
  private readonly reconnectHandlers = new Set<() => void>();
  private ws?: AuthenticatedWebSocketClient;
  private wsUnsub: (() => void)[] = [];

  constructor(deps: BinanceFuturesWebSocketClientDeps) {
    this.deps = deps;
    this.mapper = new BinanceFuturesEventMapper(deps.resolver ?? IDENTITY_SYMBOL_RESOLVER);
  }

  /* ------------------------------ subscriptions ------------------------------ */

  /** Subscribe to a canonical Futures event kind; returns an unsubscribe handle. */
  on<K extends keyof FuturesEventMap>(
    kind: K,
    handler: (event: FuturesEventMap[K]) => void,
  ): () => void {
    let set = this.handlers.get(kind);
    if (!set) {
      set = new Set();
      this.handlers.set(kind, set);
    }
    const typed = handler as (event: FuturesUserEvent) => void;
    set.add(typed);
    return () => set!.delete(typed);
  }

  /** Subscribe to every canonical Futures event; returns an unsubscribe handle. */
  onAny(handler: (event: FuturesUserEvent) => void): () => void {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  /** Subscribe to stream (re)connection; returns an unsubscribe handle. */
  onReconnect(handler: () => void): () => void {
    this.reconnectHandlers.add(handler);
    return () => this.reconnectHandlers.delete(handler);
  }

  /* ------------------------------ lifecycle ------------------------------ */

  /** Open the user-data socket around a listen key. */
  async connect(listenKey: string): Promise<void> {
    this.teardown();
    this.ws = new AuthenticatedWebSocketClient({
      url: `${this.deps.wsBaseUrl}/ws/${listenKey}`,
      factory: this.deps.factory,
      scheduler: this.deps.scheduler,
      random: this.deps.random,
      reconnectMaxAttempts: this.deps.reconnectMaxAttempts,
    });
    this.wsUnsub = [
      this.ws.onMessage((message) => this.handleRaw(message)),
      this.ws.on('reconnected', () => this.notifyReconnect()),
      this.ws.on('error', ({ error }) => this.deps.onError?.(error as unknown as Error)),
    ];
    await this.ws.connect();
  }

  /** Close the socket. */
  close(): void {
    this.teardown();
  }

  /** Whether the underlying socket is connected. */
  get connected(): boolean {
    return this.ws?.connected ?? false;
  }

  private teardown(): void {
    for (const off of this.wsUnsub) off();
    this.wsUnsub = [];
    this.ws?.close();
    this.ws = undefined;
  }

  private notifyReconnect(): void {
    for (const handler of this.reconnectHandlers) handler();
  }

  /* ------------------------------ event handling ------------------------------ */

  /** Route a raw frame to canonical Futures events (public for deterministic testing). */
  handleRaw(message: unknown): void {
    if (!isObject(message)) return;
    try {
      switch (message['e']) {
        case 'ACCOUNT_UPDATE': {
          const { account, positions } = this.mapper.base.futuresAccountUpdate(
            this.validator.futuresAccountUpdate(message),
          );
          this.dispatch(account);
          for (const position of positions) this.dispatch(position);
          break;
        }
        case 'ORDER_TRADE_UPDATE': {
          const bundle = this.mapper.base.futuresOrderTradeUpdate(
            this.validator.futuresOrderTradeUpdate(message),
          );
          this.dispatch(bundle.order);
          this.dispatch(bundle.report);
          if (bundle.trade) this.dispatch(bundle.trade);
          break;
        }
        case 'ACCOUNT_CONFIG_UPDATE':
          this.dispatch(
            this.mapper.accountConfigUpdate(
              message as unknown as BinanceFuturesAccountConfigUpdate,
            ),
          );
          break;
        case 'MARGIN_CALL':
          this.dispatch(this.mapper.marginCall(message as unknown as BinanceFuturesMarginCall));
          break;
        case 'listenKeyExpired':
          this.dispatch(
            this.mapper.base.listenKeyExpired(this.validator.listenKeyExpired(message)),
          );
          break;
        default:
          break; // Undocumented/unsupported event types are ignored.
      }
    } catch (error) {
      this.deps.onError?.(error as Error);
    }
  }

  private dispatch(event: FuturesUserEvent): void {
    for (const handler of this.handlers.get(event.kind) ?? []) handler(event);
    for (const handler of this.anyHandlers) handler(event);
  }
}
