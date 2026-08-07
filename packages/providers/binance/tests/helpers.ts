/**
 * Deterministic test doubles for the Binance provider: an in-memory HTTP transport that records
 * requests and replays scripted responses, a fake WebSocket socket factory, a fixed clock, and a
 * standard broker capability context. No real network or timers are used anywhere in the test suite.
 */
import type { HttpTransport, RawHttpRequest, RawHttpResponse } from '@platform/http-client';
import type { Socket, SocketFactory, SocketHandlers, WireData } from '@platform/websocket-client';
import type { CapabilityContext, GatewayConfiguration } from '@platform/broker-sdk';

/** A scripted HTTP response (JSON body + status). */
export interface ScriptedResponse {
  readonly status?: number;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
}

/** A handler that decides the response for a given raw request. */
export type ResponseHandler = (request: RawHttpRequest) => ScriptedResponse;

function rawResponse(scripted: ScriptedResponse): RawHttpResponse {
  const status = scripted.status ?? 200;
  const text = JSON.stringify(scripted.body ?? {});
  return {
    status,
    statusText: status === 200 ? 'OK' : 'ERR',
    headers: { 'content-type': 'application/json', ...scripted.headers },
    text: () => Promise.resolve(text),
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(text).buffer as ArrayBuffer),
    stream: () => null,
  };
}

/** An HTTP transport that records every request and answers from a route table or a default handler. */
export class FakeTransport implements HttpTransport {
  readonly requests: RawHttpRequest[] = [];
  private handler: ResponseHandler = () => ({ body: {} });
  private readonly routes: {
    match: (req: RawHttpRequest) => boolean;
    scripted: ScriptedResponse;
  }[] = [];

  /** Route by a substring of the URL (path match). */
  on(pathIncludes: string, scripted: ScriptedResponse): this {
    this.routes.push({ match: (req) => req.url.includes(pathIncludes), scripted });
    return this;
  }

  /** Set a catch-all handler. */
  onAny(handler: ResponseHandler): this {
    this.handler = handler;
    return this;
  }

  send(request: RawHttpRequest): Promise<RawHttpResponse> {
    this.requests.push(request);
    // Latest matching registration wins, so a test can override a base route.
    const route = [...this.routes].reverse().find((r) => r.match(request));
    return Promise.resolve(rawResponse(route ? route.scripted : this.handler(request)));
  }

  /** The last request whose URL contains `pathIncludes`. */
  lastRequest(pathIncludes: string): RawHttpRequest | undefined {
    return [...this.requests].reverse().find((r) => r.url.includes(pathIncludes));
  }
}

/** A fake socket that records sent frames and exposes its handlers for inbound emission. */
export class FakeSocket implements Socket {
  readonly sent: WireData[] = [];
  closed = false;
  constructor(
    readonly url: string,
    readonly handlers: SocketHandlers,
  ) {}
  send(data: WireData): void {
    this.sent.push(data);
  }
  close(code = 1000, reason = ''): void {
    this.closed = true;
    this.handlers.onClose(code, reason);
  }
}

/** A socket factory that opens synchronously (fires `onOpen`) and lets tests emit inbound messages. */
export class FakeSocketFactory implements SocketFactory {
  readonly sockets: FakeSocket[] = [];
  connect(url: string, handlers: SocketHandlers): Socket {
    const socket = new FakeSocket(url, handlers);
    this.sockets.push(socket);
    handlers.onOpen();
    return socket;
  }
  /** The most recently opened socket. */
  get socket(): FakeSocket | undefined {
    return this.sockets[this.sockets.length - 1];
  }
  /** Emit an inbound JSON message on the latest socket. */
  emit(message: unknown): void {
    this.socket?.handlers.onMessage(JSON.stringify(message));
  }
  /** Parsed frames the client sent on the latest socket. */
  sentFrames(): unknown[] {
    return (this.socket?.sent ?? []).map((f) => JSON.parse(String(f)));
  }
}

/** A monotonic, manually-advanced clock. */
export class FixedClock {
  constructor(private t: number) {}
  readonly now = (): number => this.t;
  advance(ms: number): void {
    this.t += ms;
  }
}

/** Build a gateway configuration for a broker binding. */
export function gatewayConfig(overrides: Partial<GatewayConfiguration> = {}): GatewayConfiguration {
  return {
    brokerId: 'bnc-1',
    providerId: 'binance',
    endpointRef: 'endpoint://binance',
    credentialRef: 'secret://brokers/bnc-1',
    transport: 'HYBRID',
    environment: 'LIVE',
    heartbeatIntervalMs: 30_000,
    reconnectMaxAttempts: 5,
    capabilities: ['SUBMIT_ORDER', 'QUERY_BALANCES', 'QUERY_ORDER', 'HEARTBEAT'],
    version: 1,
    ...overrides,
  };
}

/** A capability context for a broker binding. */
export function capabilityContext(config: GatewayConfiguration): CapabilityContext {
  return { brokerId: config.brokerId, config, at: new Date(0).toISOString() };
}

/** Standard test credentials (fake key/secret) for the default credential reference. */
export const TEST_SECRETS: Readonly<Record<string, string>> = {
  'secret://brokers/bnc-1/api-key': 'test-api-key',
  'secret://brokers/bnc-1/api-secret': 'test-api-secret',
};
