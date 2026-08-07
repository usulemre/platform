/**
 * `AuthenticatedWebSocketClient` — a thin wrapper over the Common WebSocket Client bound to a
 * user-data-stream URL (`<wsBase>/ws/<listenKey>`). User-data events are unsolicited, so it sends no
 * subscription frames; it simply connects, forwards each decoded message, and delegates reconnect to
 * the underlying client. All transport is INJECTED (socket factory, scheduler); it opens no real
 * network by itself. The listen-key lifecycle lives in {@link UserDataStream}, not here.
 */
import {
  isActive,
  WebSocketClient,
  type EventListener,
  type SocketFactory,
  type WebSocketEvents,
} from '@platform/websocket-client';
import type { Random, Scheduler } from '@platform/http-client';

export interface AuthenticatedWebSocketClientDeps {
  readonly url: string;
  readonly factory: SocketFactory;
  readonly scheduler?: Scheduler;
  readonly random?: Random;
  readonly reconnectMaxAttempts?: number;
}

export class AuthenticatedWebSocketClient {
  private readonly client: WebSocketClient;

  constructor(deps: AuthenticatedWebSocketClientDeps) {
    this.client = new WebSocketClient({
      url: deps.url,
      factory: deps.factory,
      scheduler: deps.scheduler,
      random: deps.random,
      reconnect: { maxAttempts: deps.reconnectMaxAttempts ?? 5 },
    });
  }

  /** Register a handler for every decoded inbound message. */
  onMessage(handler: (message: unknown) => void): () => void {
    return this.client.on('message', ({ message }) => handler(message));
  }

  /** Subscribe to a lifecycle event of the underlying client. */
  on<K extends keyof WebSocketEvents>(
    type: K,
    listener: EventListener<WebSocketEvents[K]>,
  ): () => void {
    return this.client.on(type, listener);
  }

  connect(): Promise<void> {
    return this.client.connect();
  }

  close(code?: number, reason?: string): void {
    this.client.close(code, reason);
  }

  get state(): string {
    return this.client.state;
  }

  get connected(): boolean {
    return isActive(this.client.state);
  }
}
