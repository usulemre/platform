import { describe, it, expect, vi } from 'vitest';
import { ManualScheduler } from '@platform/http-client';
import {
  ConnectionError,
  ConnectionPool,
  ProtocolError,
  ReconnectFailedError,
  WebSocketClient,
  type WebSocketClientConfig,
  canTransition,
  describeConnectionState,
  type Socket,
  type SocketFactory,
  type SocketHandlers,
  type WireData,
} from '../src/index';

/* --------------------------------- fake transport --------------------------------- */

class FakeSocket implements Socket {
  readonly sent: WireData[] = [];
  closed = false;
  constructor(
    readonly url: string,
    private readonly handlers: SocketHandlers,
  ) {}
  send(data: WireData): void {
    this.sent.push(data);
  }
  close(code = 1000, reason = ''): void {
    if (this.closed) return;
    this.closed = true;
    this.handlers.onClose(code, reason);
  }
  open(): void {
    this.handlers.onOpen();
  }
  emit(message: unknown): void {
    this.handlers.onMessage(typeof message === 'string' ? message : JSON.stringify(message));
  }
  fail(error: unknown): void {
    this.handlers.onError(error);
  }
  sentJson(): unknown[] {
    return this.sent.map((d) => JSON.parse(d as string));
  }
}

class FakeSocketFactory implements SocketFactory {
  readonly sockets: FakeSocket[] = [];
  connect(url: string, handlers: SocketHandlers): Socket {
    const socket = new FakeSocket(url, handlers);
    this.sockets.push(socket);
    return socket;
  }
  get last(): FakeSocket {
    return this.sockets[this.sockets.length - 1]!;
  }
}

function make(config: Partial<WebSocketClientConfig> = {}) {
  const scheduler = new ManualScheduler({ startAt: 0 });
  const factory = new FakeSocketFactory();
  const client = new WebSocketClient({
    url: 'wss://api.x.com/stream',
    factory,
    scheduler,
    heartbeat: false,
    reconnect: false,
    random: () => 0,
    ...config,
  });
  return { scheduler, factory, client };
}
async function connected(config: Partial<WebSocketClientConfig> = {}) {
  const ctx = make(config);
  const promise = ctx.client.connect();
  ctx.factory.last.open();
  await promise;
  return ctx;
}

/* --------------------------------- state machine --------------------------------- */

describe('connection state machine', () => {
  it('describes states and validates transitions', () => {
    expect(describeConnectionState('HEALTHY').canSend).toBe(true);
    expect(describeConnectionState('RECONNECTING').canSend).toBe(false);
    expect(canTransition('CONNECTING', 'CONNECTED')).toBe(true);
    expect(canTransition('DISCONNECTED', 'HEALTHY')).toBe(false);
    expect(canTransition('RECONNECTING', 'CONNECTING')).toBe(true);
  });
});

/* --------------------------------- lifecycle --------------------------------- */

describe('connection lifecycle', () => {
  it('connects to HEALTHY and emits state changes', async () => {
    const states: string[] = [];
    const { client, factory } = make();
    client.on('state', (e) => states.push(e.to));
    const promise = client.connect();
    expect(client.state).toBe('CONNECTING');
    factory.last.open();
    await promise;
    expect(client.state).toBe('HEALTHY');
    expect(states).toEqual(['CONNECTING', 'CONNECTED', 'HEALTHY']);
  });

  it('runs an injected authentication handshake', async () => {
    const authenticate = vi.fn(async (c: WebSocketClient) => {
      c.send({ op: 'auth' });
    });
    const { client, factory } = await connected({ authenticate });
    expect(authenticate).toHaveBeenCalledOnce();
    expect(factory.last.sentJson()).toContainEqual({ op: 'auth' });
    expect(client.context().sessionId).toBeDefined();
  });

  it('shuts down gracefully without reconnecting', async () => {
    const { client, scheduler } = await connected({ reconnect: { maxAttempts: 5 } });
    client.close();
    expect(client.state).toBe('CLOSED');
    scheduler.flush();
    expect(client.state).toBe('CLOSED');
  });
});

/* --------------------------------- subscriptions & routing --------------------------------- */

describe('subscriptions & message routing', () => {
  it('subscribes, routes messages and re-subscribes after reconnect', async () => {
    const received: unknown[] = [];
    const { client, factory, scheduler } = await connected({
      reconnect: { baseDelayMs: 100, jitter: 'none' },
    });
    client.subscribe('trades', (m) => received.push(m));
    expect(factory.last.sentJson()).toContainEqual({ type: 'subscribe', topic: 'trades' });

    factory.last.emit({ topic: 'trades', price: 100 });
    expect(received).toEqual([{ topic: 'trades', price: 100 }]);

    // drop the connection → reconnect → re-subscribe on the new socket
    factory.last.close(1006, 'lost');
    expect(client.state).toBe('RECONNECTING');
    scheduler.advance(100);
    factory.last.open();
    await Promise.resolve();
    expect(client.state).toBe('HEALTHY');
    expect(factory.sockets).toHaveLength(2);
    expect(factory.last.sentJson()).toContainEqual({ type: 'subscribe', topic: 'trades' });
  });

  it('reports unknown messages and serialization errors', async () => {
    const errors: string[] = [];
    const { client, factory } = await connected();
    client.on('error', (e) => errors.push(e.error.kind));
    factory.last.emit({ unrelated: true }); // no topic/id → unknown
    factory.last.emit('not-json{'); // decode failure
    expect(errors).toEqual(['unknown-message', 'serialization']);
  });
});

/* --------------------------------- request / response --------------------------------- */

describe('request/response correlation', () => {
  it('resolves a correlated response', async () => {
    const { client, factory } = await connected();
    const response = client.request({ id: 'r1', op: 'time' }, { correlationId: 'r1' });
    factory.last.emit({ id: 'r1', result: 42 });
    expect(await response).toEqual({ id: 'r1', result: 42 });
  });

  it('times out a request deterministically', async () => {
    const { client, scheduler } = await connected();
    const response = client.request({ id: 'r2' }, { correlationId: 'r2', timeoutMs: 1000 });
    scheduler.advance(1000);
    await expect(response).rejects.toBeInstanceOf(ProtocolError);
  });
});

/* --------------------------------- heartbeat --------------------------------- */

describe('heartbeat', () => {
  it('pings and reconnects on a missed pong', async () => {
    const { client, factory, scheduler } = await connected({
      heartbeat: { intervalMs: 1000, timeoutMs: 500 },
      reconnect: { baseDelayMs: 100, jitter: 'none' },
    });
    scheduler.advance(1000); // ping sent
    expect(factory.last.sentJson()).toContainEqual({ type: 'ping' });
    scheduler.advance(500); // no pong → timeout → close → reconnect
    expect(client.metricsSnapshot().heartbeatTimeouts).toBe(1);
    expect(client.state).toBe('RECONNECTING');
  });

  it('clears the timeout when a pong arrives', async () => {
    const { client, factory, scheduler } = await connected({
      heartbeat: { intervalMs: 1000, timeoutMs: 500 },
    });
    scheduler.advance(1000); // ping
    factory.last.emit({ type: 'pong' });
    scheduler.advance(500); // pong already cleared the timeout
    expect(client.state).toBe('HEALTHY');
    expect(client.metricsSnapshot().heartbeats).toBe(1);
  });
});

/* --------------------------------- reconnect budget --------------------------------- */

describe('reconnect engine', () => {
  it('gives up after the maximum attempts', async () => {
    const reconnecting: number[] = [];
    let failed = false;
    const { client, factory, scheduler } = await connected({
      reconnect: { maxAttempts: 2, baseDelayMs: 100, factor: 2, jitter: 'none' },
    });
    client.on('reconnecting', (e) => reconnecting.push(e.delayMs));
    client.on('error', (e) => {
      if (e.error instanceof ReconnectFailedError) failed = true;
    });
    factory.last.close(1006, 'lost'); // attempt 1 (100ms)
    scheduler.advance(100);
    factory.last.close(1006, 'lost'); // attempt 2 (200ms)
    scheduler.advance(200);
    factory.last.close(1006, 'lost'); // attempt 3 > max → give up
    expect(reconnecting).toEqual([100, 200]);
    expect(failed).toBe(true);
    expect(client.state).toBe('CLOSED');
  });
});

/* --------------------------------- buffering & backpressure --------------------------------- */

describe('buffering & backpressure', () => {
  it('buffers while disconnected and flushes on connect', async () => {
    const { client, factory } = make();
    client.send({ seq: 1 });
    client.send({ seq: 2 });
    const promise = client.connect();
    factory.last.open();
    await promise;
    expect(factory.last.sentJson()).toEqual([{ seq: 1 }, { seq: 2 }]);
  });

  it('applies backpressure when the buffer is full', () => {
    const { client } = make({ maxBuffer: 1 });
    client.send({ seq: 1 });
    expect(() => client.send({ seq: 2 })).toThrow(ConnectionError);
  });
});

/* --------------------------------- pool foundation --------------------------------- */

describe('connection pool (foundation)', () => {
  it('is get-or-create and closes all', () => {
    const pool = new ConnectionPool();
    const factory = new FakeSocketFactory();
    const config = {
      url: 'wss://a',
      factory,
      scheduler: new ManualScheduler(),
      heartbeat: false as const,
      reconnect: false as const,
    };
    const a = pool.getOrCreate('a', config);
    expect(pool.getOrCreate('a', config)).toBe(a);
    expect(pool.size).toBe(1);
    pool.closeAll();
    expect(pool.size).toBe(0);
  });
});
