/**
 * `WebSocketClient` — the canonical, provider-independent real-time client. It composes the state
 * machine, connection/session/subscription managers, message router, request/response correlator,
 * heartbeat and reconnect engines, codec, event dispatcher and metrics into one facade. It drives the
 * lifecycle (connect → authenticate → subscribe → healthy), reconnects with backoff+jitter, re-subscribes
 * transparently, buffers outbound messages with backpressure while disconnected, and shuts down
 * gracefully. Every side effect (time, timers) is injected via the `Scheduler`, so behavior is fully
 * deterministic. NO provider protocol is baked in — subscribe/ping frames, topic/correlation extraction
 * and authentication are all injected hooks.
 *
 * Thread-safety note: JavaScript is single-threaded; state transitions, buffer and subscription
 * mutations happen synchronously with no interleaving `await`, so concurrent callbacks observe a
 * consistent client state.
 */
import { SystemScheduler, type Cancel, type Random, type Scheduler } from '@platform/http-client';
import { ChannelRegistry } from './channel';
import { JsonMessageCodec, type MessageCodec } from './codec';
import { ConnectionManager } from './connection';
import { Correlator } from './correlation';
import { createConnectionContext, type ConnectionContext } from './context';
import {
  AuthenticationError,
  ConnectionError,
  HeartbeatTimeoutError,
  ReconnectFailedError,
  UnknownMessageError,
  type WebSocketError,
} from './errors';
import { EventDispatcher, type EventListener, type WebSocketEvents } from './events';
import { HeartbeatManager } from './heartbeat';
import { ConnectionMetrics, type ConnectionMetricsSnapshot } from './metrics';
import { ReconnectEngine, createReconnectPolicy, type ReconnectPolicy } from './reconnect';
import { MessageRouter } from './router';
import { SessionManager } from './session';
import { canSend, describeConnectionState, isActive, type ConnectionState } from './state';
import { ConnectionStateMachine } from './state-machine';
import { SubscriptionManager, type MessageHandler, type Subscription } from './subscription';
import type { SocketFactory, WireData } from './transport';

let connectionCounter = 0;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : undefined;
}

export interface HeartbeatConfig {
  readonly intervalMs: number;
  readonly timeoutMs: number;
  readonly buildPing?: () => unknown;
}

export interface WebSocketClientConfig {
  readonly url: string;
  readonly factory: SocketFactory;
  readonly scheduler?: Scheduler;
  readonly random?: Random;
  readonly codec?: MessageCodec;
  readonly reconnect?: Partial<ReconnectPolicy> | false;
  readonly heartbeat?: HeartbeatConfig | false;
  /** Outbound buffer cap while disconnected (backpressure). Default 1000. */
  readonly maxBuffer?: number;
  readonly requestTimeoutMs?: number;
  /* provider hooks (all optional / injected) */
  readonly authenticate?: (client: WebSocketClient) => Promise<void>;
  readonly buildSubscribe?: (topic: string, params?: Readonly<Record<string, unknown>>) => unknown;
  readonly buildUnsubscribe?: (topic: string) => unknown;
  readonly resolveTopic?: (message: unknown) => string | undefined;
  readonly resolveCorrelationId?: (message: unknown) => string | undefined;
  readonly isControl?: (message: unknown) => boolean;
  readonly onControl?: (message: unknown) => void;
}

export interface RequestOptions {
  readonly correlationId: string;
  readonly timeoutMs?: number;
}

export class WebSocketClient {
  readonly url: string;
  readonly events = new EventDispatcher<WebSocketEvents>();
  private readonly connectionId = `ws-${(connectionCounter += 1)}`;
  private readonly scheduler: Scheduler;
  private readonly codec: MessageCodec;
  private readonly maxBuffer: number;
  private readonly startedAt: number;

  private readonly stateMachine: ConnectionStateMachine;
  private readonly connection: ConnectionManager;
  private readonly session = new SessionManager();
  private readonly subscriptions = new SubscriptionManager();
  private readonly channels = new ChannelRegistry();
  private readonly correlator: Correlator;
  private readonly router: MessageRouter;
  private readonly reconnectEngine: ReconnectEngine;
  private readonly metrics = new ConnectionMetrics();

  private heartbeat?: HeartbeatManager;
  private reconnectTimer?: Cancel;
  private outBuffer: unknown[] = [];
  private graceful = false;
  private wasReconnecting = false;
  private connectResolve?: () => void;
  private connectReject?: (error: Error) => void;

  constructor(private readonly config: WebSocketClientConfig) {
    this.url = config.url;
    this.scheduler = config.scheduler ?? new SystemScheduler();
    this.codec = config.codec ?? new JsonMessageCodec();
    this.maxBuffer = config.maxBuffer ?? 1000;
    this.startedAt = this.scheduler.now();
    this.stateMachine = new ConnectionStateMachine(this.events, 'DISCONNECTED');
    this.connection = new ConnectionManager(config.factory);
    this.correlator = new Correlator(this.scheduler);
    this.reconnectEngine = new ReconnectEngine(
      config.reconnect === false
        ? createReconnectPolicy({ maxAttempts: 1 })
        : createReconnectPolicy(config.reconnect),
      config.random ?? Math.random,
    );
    this.router = new MessageRouter({
      subscriptions: this.subscriptions,
      correlator: this.correlator,
      isControl:
        config.isControl ?? ((m) => isObject(m) && (m['type'] === 'pong' || m['pong'] === true)),
      onControl: (m) => this.handleControl(m),
      resolveCorrelationId:
        config.resolveCorrelationId ??
        ((m) => (isObject(m) ? asString(m['id'] ?? m['correlationId'] ?? m['reqId']) : undefined)),
      resolveTopic:
        config.resolveTopic ??
        ((m) => (isObject(m) ? asString(m['topic'] ?? m['channel']) : undefined)),
      onUnknown: (m) => this.emitError(new UnknownMessageError(m)),
    });
  }

  /* ------------------------------ public API ------------------------------ */

  get state(): ConnectionState {
    return this.stateMachine.state;
  }
  on<K extends keyof WebSocketEvents>(
    type: K,
    listener: EventListener<WebSocketEvents[K]>,
  ): () => void {
    return this.events.on(type, listener);
  }
  metricsSnapshot(): ConnectionMetricsSnapshot {
    return this.metrics.snapshot();
  }
  context(): ConnectionContext {
    return createConnectionContext({
      connectionId: this.connectionId,
      url: this.url,
      state: this.state,
      attempt: this.reconnectEngine.attempts,
      startedAt: this.startedAt,
      sessionId: this.session.id,
    });
  }

  /** Open the connection; resolves once HEALTHY (after optional authentication). */
  connect(): Promise<void> {
    if (isActive(this.state) || this.state === 'CONNECTING') return Promise.resolve();
    this.graceful = false;
    return new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
      this.startConnecting('connect');
    });
  }

  /** Send a message (buffered with backpressure while disconnected). */
  send(message: unknown): void {
    if (canSend(this.state)) this.sendMessage(message);
    else this.buffer(message);
  }

  /** Send a request and await the correlated response. */
  request(message: unknown, options: RequestOptions): Promise<unknown> {
    const promise = this.correlator.register(
      options.correlationId,
      options.timeoutMs ?? this.config.requestTimeoutMs ?? 0,
    );
    this.send(message);
    return promise;
  }

  /** Subscribe to a topic; the subscription is re-established automatically after a reconnect. */
  subscribe<T = unknown>(
    topic: string,
    handler: MessageHandler<T>,
    params?: Readonly<Record<string, unknown>>,
  ): Subscription<T> {
    const subscription = this.subscriptions.add<T>(topic, handler, this.now(), params);
    this.channels.register(topic, params, this.now());
    if (canSend(this.state)) {
      this.sendMessage(this.buildSubscribe(topic, params));
      this.subscriptions.setActive(topic, true);
      if (this.state !== 'HEALTHY') this.transition('SUBSCRIBED', 'subscribe');
      this.events.emit('subscribed', { topic, at: this.now() });
    }
    this.metrics.onSubscribe();
    this.metrics.setActiveSubscriptions(this.subscriptions.activeCount);
    return subscription;
  }

  /** Unsubscribe from a topic. */
  unsubscribe(topic: string): void {
    if (!this.subscriptions.has(topic)) return;
    if (canSend(this.state)) this.sendMessage(this.buildUnsubscribe(topic));
    this.subscriptions.remove(topic);
    this.channels.unregister(topic);
    this.metrics.onUnsubscribe();
    this.metrics.setActiveSubscriptions(this.subscriptions.activeCount);
    this.events.emit('unsubscribed', { topic, at: this.now() });
  }

  /** Graceful shutdown: stop heartbeats, cancel reconnects, close the socket, reject pending requests. */
  close(code = 1000, reason = 'client-close'): void {
    this.graceful = true;
    this.reconnectTimer?.();
    this.reconnectTimer = undefined;
    this.stopHeartbeat();
    if (this.connection.connected) this.connection.close(code, reason);
    else if (this.state !== 'CLOSED') this.transition('CLOSED', 'client-close');
    this.correlator.rejectAll(new ConnectionError('Client closed.'));
  }

  /* ------------------------------ lifecycle internals ------------------------------ */

  private startConnecting(reason: string): void {
    this.transition('CONNECTING', reason);
    this.connection.open(this.url, {
      onOpen: () => void this.handleOpen(),
      onMessage: (data) => this.handleMessage(data),
      onClose: (codeValue, reasonValue) => this.handleClose(codeValue, reasonValue),
      onError: (error) => this.emitError(new ConnectionError('Socket error.', error)),
    });
  }

  private async handleOpen(): Promise<void> {
    this.metrics.onConnect();
    this.transition('CONNECTED', 'socket-open');
    this.session.open(this.now());
    this.events.emit('open', { at: this.now() });
    try {
      if (this.config.authenticate) {
        this.transition('AUTHENTICATING', 'auth-start');
        await this.config.authenticate(this);
        this.session.authenticate(this.now());
        this.transition('AUTHENTICATED', 'auth-ok');
      }
      this.resubscribe();
      this.startHeartbeat();
      this.transition('HEALTHY', 'ready');
      if (this.wasReconnecting) {
        this.wasReconnecting = false;
        this.metrics.onReconnect();
        this.events.emit('reconnected', {
          attempts: this.reconnectEngine.attempts,
          at: this.now(),
        });
        this.reconnectEngine.reset();
      }
      this.flushBuffer();
      this.connectResolve?.();
      this.connectResolve = undefined;
      this.connectReject = undefined;
    } catch (cause) {
      const error = new AuthenticationError('Authentication failed.', cause);
      this.emitError(error);
      this.connectReject?.(error);
      this.connectReject = undefined;
      this.connectResolve = undefined;
      if (this.connection.connected) this.connection.close(4001, 'auth-failed');
    }
  }

  private handleClose(code: number, reason: string): void {
    this.metrics.onDisconnect();
    this.stopHeartbeat();
    this.subscriptions.markAll(false);
    this.metrics.setActiveSubscriptions(0);
    this.session.close();
    this.correlator.rejectAll(new ConnectionError(`Connection closed (${code}).`));
    this.events.emit('close', { code, reason, at: this.now() });
    if (this.graceful || this.config.reconnect === false) {
      if (this.state !== 'CLOSED') this.transition('CLOSED', 'closed');
      return;
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    this.transition('RECONNECTING', 'connection-lost');
    this.wasReconnecting = true;
    const plan = this.reconnectEngine.next();
    if (!plan) {
      this.emitError(new ReconnectFailedError(this.reconnectEngine.attempts));
      this.transition('CLOSED', 'reconnect-exhausted');
      return;
    }
    this.events.emit('reconnecting', {
      attempt: plan.attempt,
      delayMs: plan.delayMs,
      at: this.now(),
    });
    this.reconnectTimer = this.scheduler.schedule(() => {
      this.reconnectTimer = undefined;
      if (this.graceful) return;
      this.startConnecting('reconnect');
    }, plan.delayMs);
  }

  private resubscribe(): void {
    for (const subscription of this.subscriptions.all()) {
      this.sendMessage(this.buildSubscribe(subscription.topic, subscription.params));
      this.subscriptions.setActive(subscription.topic, true);
      this.events.emit('subscribed', { topic: subscription.topic, at: this.now() });
    }
    if (this.subscriptions.size > 0) this.transition('SUBSCRIBED', 'resubscribe');
    this.metrics.setActiveSubscriptions(this.subscriptions.activeCount);
  }

  /* ------------------------------ messages ------------------------------ */

  private handleMessage(data: WireData): void {
    let message: unknown;
    try {
      message = this.codec.decode(data);
    } catch (error) {
      this.emitError(error as WebSocketError);
      return;
    }
    this.metrics.onReceived();
    this.events.emit('message', { message, at: this.now() });
    this.router.route(message);
  }

  private handleControl(message: unknown): void {
    this.heartbeat?.pong();
    this.metrics.onHeartbeat();
    this.events.emit('heartbeat', { at: this.now() });
    this.config.onControl?.(message);
  }

  private sendMessage(message: unknown): void {
    this.connection.send(this.codec.encode(message));
    this.metrics.onSent();
  }
  private buffer(message: unknown): void {
    if (this.outBuffer.length >= this.maxBuffer)
      throw new ConnectionError('Send buffer is full (backpressure).');
    this.outBuffer.push(message);
    this.metrics.onBuffered(this.outBuffer.length);
  }
  private flushBuffer(): void {
    const pending = this.outBuffer;
    this.outBuffer = [];
    this.metrics.onBuffered(0);
    for (const message of pending) this.sendMessage(message);
  }

  /* ------------------------------ heartbeat ------------------------------ */

  private startHeartbeat(): void {
    if (this.config.heartbeat === false || this.config.heartbeat === undefined) return;
    const heartbeat = this.config.heartbeat;
    const buildPing = heartbeat.buildPing ?? (() => ({ type: 'ping' }));
    this.heartbeat = new HeartbeatManager({
      scheduler: this.scheduler,
      intervalMs: heartbeat.intervalMs,
      timeoutMs: heartbeat.timeoutMs,
      sendPing: () => this.sendMessage(buildPing()),
      onTimeout: () => this.onHeartbeatTimeout(heartbeat.timeoutMs),
    });
    this.heartbeat.start();
  }
  private stopHeartbeat(): void {
    this.heartbeat?.stop();
    this.heartbeat = undefined;
  }
  private onHeartbeatTimeout(timeoutMs: number): void {
    this.metrics.onHeartbeatTimeout();
    this.emitError(new HeartbeatTimeoutError(timeoutMs));
    if (this.connection.connected) this.connection.close(4000, 'heartbeat-timeout');
  }

  /* ------------------------------ helpers ------------------------------ */

  private buildSubscribe(topic: string, params?: Readonly<Record<string, unknown>>): unknown {
    return this.config.buildSubscribe
      ? this.config.buildSubscribe(topic, params)
      : { type: 'subscribe', topic, ...(params ? { params } : {}) };
  }
  private buildUnsubscribe(topic: string): unknown {
    return this.config.buildUnsubscribe
      ? this.config.buildUnsubscribe(topic)
      : { type: 'unsubscribe', topic };
  }
  private emitError(error: WebSocketError): void {
    this.metrics.onError(error.kind);
    this.events.emit('error', { error, at: this.now() });
  }
  private transition(to: ConnectionState, reason: string): boolean {
    return this.stateMachine.transition(to, reason, this.now());
  }
  private now(): number {
    return this.scheduler.now();
  }
}

/** Human-readable label for the current state (convenience for logging/UI). */
export function stateLabel(state: ConnectionState): string {
  return describeConnectionState(state).label;
}
