/**
 * `BinanceAuthenticationService` — the facade and single entry point for authenticated Binance
 * communication. It composes request signing ({@link RequestSigner} over the reused
 * {@link BinanceAuthentication}), server-time / clock synchronization, the authentication state machine,
 * and the authenticated {@link UserDataStream}. It authenticates (verifies credentials + aligns the
 * clock) and exposes canonical account events through the user data stream. It signs requests and
 * manages sessions, but it never places orders or runs trading logic.
 */
import { RequestSigner } from './signer';
import { ServerTimeSynchronizer } from './clock';
import { AuthenticationStateManager } from './state';
import { UserDataStream } from './user-data-stream';
import type { AuthenticatedRestClient } from './rest';
import type { BinanceAuthentication } from './authentication';
import type { AuthenticationState, AuthenticationStateChangedEvent } from './events';
import type { BinanceConfiguration } from '../config';
import type { SymbolResolver } from '../websocket/event-mapper';
import type { Random, Scheduler } from '@platform/http-client';
import type { SocketFactory } from '@platform/websocket-client';

export interface AuthenticationResult {
  readonly authenticated: boolean;
  readonly serverOffsetMs: number;
}

export interface BinanceAuthenticationServiceDeps {
  readonly config: BinanceConfiguration;
  readonly auth: BinanceAuthentication;
  readonly rest: AuthenticatedRestClient;
  readonly clock: () => number;
  readonly scheduler: Scheduler;
  readonly random?: Random;
  readonly resolver?: SymbolResolver;
  /** Socket factory for the user data stream (required only for streaming). */
  readonly factory?: SocketFactory;
  readonly keepAliveIntervalMs?: number;
  readonly reconnectMaxAttempts?: number;
  readonly onStateChange?: (event: AuthenticationStateChangedEvent) => void;
  readonly onError?: (error: Error) => void;
}

export class BinanceAuthenticationService {
  readonly signer: RequestSigner;
  readonly serverTime: ServerTimeSynchronizer;
  private readonly deps: BinanceAuthenticationServiceDeps;
  private readonly stateManager: AuthenticationStateManager;
  private stream?: UserDataStream;

  constructor(deps: BinanceAuthenticationServiceDeps) {
    this.deps = deps;
    this.serverTime = new ServerTimeSynchronizer({
      clock: deps.clock,
      source: () => deps.rest.serverTime(),
      ttlMs: deps.config.timeSyncTtlMs,
    });
    this.signer = new RequestSigner(deps.auth, deps.config, this.serverTime.clock);
    this.stateManager = new AuthenticationStateManager({
      clock: deps.clock,
      onChange: deps.onStateChange,
    });
  }

  /** The current authentication state. */
  get state(): AuthenticationState {
    return this.stateManager.state;
  }

  /**
   * Authenticate: verify the credential references resolve and align the local clock to the venue
   * server time (so signed requests stay within `recvWindow`). Returns the measured server offset.
   */
  async authenticate(): Promise<AuthenticationResult> {
    if (!this.signer.isConfigured())
      throw new Error(
        `Broker "${this.deps.config.brokerId}" is missing API key/secret references; cannot authenticate.`,
      );
    const serverOffsetMs = await this.serverTime.synchronize();
    return { authenticated: true, serverOffsetMs };
  }

  /** A server-aligned timestamp for signing. */
  timestamp(): number {
    return this.serverTime.now();
  }

  /**
   * The authenticated user data stream (created and memoized on first use). Call `start()` on the
   * returned stream to open it. Requires a socket factory.
   */
  userDataStream(): UserDataStream {
    if (!this.deps.factory)
      throw new Error('No socket factory was injected; the user data stream is unavailable.');
    if (!this.stream) {
      this.stream = new UserDataStream({
        market: this.deps.config.market,
        wsBaseUrl: this.deps.config.wsBaseUrl,
        rest: this.deps.rest,
        factory: this.deps.factory,
        stateManager: this.stateManager,
        clock: this.deps.clock,
        scheduler: this.deps.scheduler,
        random: this.deps.random,
        resolver: this.deps.resolver,
        keepAliveIntervalMs: this.deps.keepAliveIntervalMs,
        reconnectMaxAttempts: this.deps.reconnectMaxAttempts,
        onError: this.deps.onError,
      });
    }
    return this.stream;
  }

  /** Close the authenticated session (stops the user data stream if open). */
  async close(): Promise<void> {
    if (this.stream) await this.stream.stop();
    else this.stateManager.transition('CLOSED', 'service-close');
  }
}

/** Construct a {@link BinanceAuthenticationService}. */
export function createBinanceAuthenticationService(
  deps: BinanceAuthenticationServiceDeps,
): BinanceAuthenticationService {
  return new BinanceAuthenticationService(deps);
}
