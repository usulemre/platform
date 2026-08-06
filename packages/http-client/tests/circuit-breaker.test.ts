import { describe, it, expect } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerEngine,
  CircuitPolicyRegistry,
  CircuitRegistry,
  CountSlidingWindow,
  DEFAULT_CIRCUIT_POLICY,
  HttpCircuitOpenError,
  HttpHeaders,
  HttpRequestBuilder,
  HttpTransportError,
  MiddlewareHttpClient,
  MiddlewarePipeline,
  TimeSlidingWindow,
  canTransition,
  classifyForCircuit,
  createCircuitPolicy,
  describeCircuitState,
  type CircuitEvent,
  type CircuitPolicy,
  type HttpRequest,
  type HttpResponse,
  type HttpTransport,
  type RawHttpRequest,
  type RawHttpResponse,
} from '../src/index';

/* --------------------------------- helpers --------------------------------- */

const REQ: HttpRequest = HttpRequestBuilder.create('GET', 'https://api.x.com/v1/ping').build(0);

function resp(status: number): HttpResponse {
  return {
    status,
    statusText: '',
    ok: status >= 200 && status < 300,
    headers: HttpHeaders.empty(),
    body: { status },
    request: REQ,
    context: {
      requestId: REQ.context.requestId,
      startedAt: 0,
      completedAt: 1,
      durationMs: 1,
      attributes: {},
    },
    metadata: {},
  };
}

function makeClock(start = 0): {
  now: () => number;
  set: (v: number) => void;
  advance: (ms: number) => void;
} {
  let t = start;
  return { now: () => t, set: (v) => (t = v), advance: (ms) => (t += ms) };
}

const POLICY: CircuitPolicy = createCircuitPolicy({
  failureThreshold: 3,
  minimumThroughput: 3,
  successThreshold: 2,
  recoveryTimeoutMs: 1000,
  halfOpenMaxCalls: 1,
  window: { type: 'count', size: 10 },
});

function breakerWith(clock: () => number, policy: CircuitPolicy = POLICY): CircuitBreaker {
  return new CircuitBreaker('test', policy, { clock });
}
function failOnce(breaker: CircuitBreaker): void {
  const permit = breaker.tryAcquire();
  breaker.record(permit, { error: new HttpTransportError('reset', REQ) });
}
function succeedOnce(breaker: CircuitBreaker): void {
  const permit = breaker.tryAcquire();
  breaker.record(permit, { response: resp(200) });
}

/* --------------------------------- state machine --------------------------------- */

describe('circuit state machine', () => {
  it('describes states and validates transitions', () => {
    expect(describeCircuitState('CLOSED').permitsCalls).toBe(true);
    expect(describeCircuitState('OPEN').permitsCalls).toBe(false);
    expect(canTransition('CLOSED', 'OPEN')).toBe(true);
    expect(canTransition('OPEN', 'HALF_OPEN')).toBe(true);
    expect(canTransition('HALF_OPEN', 'CLOSED')).toBe(true);
    expect(canTransition('CLOSED', 'HALF_OPEN')).toBe(false);
  });

  it('opens after the failure threshold within minimum throughput', () => {
    const breaker = breakerWith(makeClock().now);
    failOnce(breaker);
    failOnce(breaker);
    expect(breaker.state).toBe('CLOSED'); // 2 < threshold 3
    failOnce(breaker);
    expect(breaker.state).toBe('OPEN');
    expect(breaker.tryAcquire().allowed).toBe(false);
  });

  it('recovers CLOSED after successful half-open trials', () => {
    const clock = makeClock();
    const breaker = breakerWith(clock.now);
    failOnce(breaker);
    failOnce(breaker);
    failOnce(breaker);
    expect(breaker.state).toBe('OPEN');

    clock.set(1000); // recovery timeout elapsed
    const trial = breaker.tryAcquire();
    expect(trial.allowed).toBe(true);
    expect(breaker.state).toBe('HALF_OPEN');
    expect(trial.halfOpenTrial).toBe(true);
    breaker.record(trial, { response: resp(200) }); // success 1 of 2
    expect(breaker.state).toBe('HALF_OPEN');
    succeedOnce(breaker); // success 2 of 2 → CLOSED
    expect(breaker.state).toBe('CLOSED');
    expect(breaker.snapshot().failures).toBe(0);
  });

  it('reopens on a failed half-open trial', () => {
    const clock = makeClock();
    const breaker = breakerWith(clock.now);
    failOnce(breaker);
    failOnce(breaker);
    failOnce(breaker);
    clock.set(1000);
    const trial = breaker.tryAcquire();
    breaker.record(trial, { error: new HttpTransportError('still-bad', REQ) });
    expect(breaker.state).toBe('OPEN');
  });

  it('limits concurrent half-open trials', () => {
    const clock = makeClock();
    const breaker = breakerWith(clock.now);
    failOnce(breaker);
    failOnce(breaker);
    failOnce(breaker);
    clock.set(1000);
    const first = breaker.tryAcquire();
    expect(first.allowed).toBe(true);
    const second = breaker.tryAcquire();
    expect(second.allowed).toBe(false);
    expect(second.reason).toBe('half-open-limit');
  });
});

/* --------------------------------- classification --------------------------------- */

describe('failure classification', () => {
  it('counts failures, ignores caller-side errors', () => {
    expect(classifyForCircuit({ response: resp(503) }, POLICY)).toBe('failure');
    expect(classifyForCircuit({ error: new HttpTransportError('x', REQ) }, POLICY)).toBe('failure');
    expect(classifyForCircuit({ response: resp(200) }, POLICY)).toBe('success');
    expect(classifyForCircuit({ response: resp(404) }, POLICY)).toBe('ignored');
    expect(classifyForCircuit({ response: resp(429) }, POLICY)).toBe('ignored'); // includeRateLimit false
    expect(
      classifyForCircuit({ response: resp(429) }, createCircuitPolicy({ includeRateLimit: true })),
    ).toBe('failure');
  });

  it('ignored outcomes never open the circuit', () => {
    const breaker = breakerWith(makeClock().now);
    for (let i = 0; i < 10; i += 1) {
      const permit = breaker.tryAcquire();
      breaker.record(permit, { response: resp(404) });
    }
    expect(breaker.state).toBe('CLOSED');
    expect(breaker.snapshot().failures).toBe(0);
  });
});

/* --------------------------------- operator controls --------------------------------- */

describe('operator controls', () => {
  it('forces open, forces closed and disables', () => {
    const breaker = breakerWith(makeClock().now);
    breaker.forceOpen();
    expect(breaker.tryAcquire().allowed).toBe(false);

    breaker.forceClosed();
    for (let i = 0; i < 10; i += 1) failOnce(breaker);
    expect(breaker.state).toBe('FORCED_CLOSED'); // never opens

    breaker.disable();
    const permit = breaker.tryAcquire();
    expect(permit.allowed).toBe(true);
    breaker.record(permit, { error: new HttpTransportError('x', REQ) });
    expect(breaker.state).toBe('DISABLED'); // no tracking
  });

  it('manual reset returns to CLOSED and clears tracking', () => {
    const breaker = breakerWith(makeClock().now);
    failOnce(breaker);
    failOnce(breaker);
    failOnce(breaker);
    expect(breaker.state).toBe('OPEN');
    breaker.reset();
    expect(breaker.state).toBe('CLOSED');
    expect(breaker.snapshot().total).toBe(0);
  });
});

/* --------------------------------- execute / errors / metrics / events --------------------------------- */

describe('execute, metrics and events', () => {
  it('short-circuits an open breaker and runs a closed one', async () => {
    const breaker = breakerWith(makeClock().now);
    breaker.forceOpen();
    await expect(breaker.execute(REQ, async () => resp(200))).rejects.toBeInstanceOf(
      HttpCircuitOpenError,
    );
    breaker.reset();
    const response = await breaker.execute(REQ, async () => resp(200));
    expect(response.status).toBe(200);
  });

  it('collects metrics and emits state-change events', () => {
    const events: CircuitEvent[] = [];
    const breaker = breakerWith(makeClock().now);
    breaker.on((event) => events.push(event));
    failOnce(breaker);
    failOnce(breaker);
    failOnce(breaker);
    const metrics = breaker.metricsSnapshot();
    expect(metrics.failures).toBe(3);
    expect(metrics.timesOpened).toBe(1);
    expect(metrics.permittedCalls).toBe(3);
    expect(events.some((e) => e.type === 'STATE_CHANGED' && e.state === 'OPEN')).toBe(true);
  });
});

/* --------------------------------- sliding windows --------------------------------- */

describe('sliding windows', () => {
  it('count window keeps the last N outcomes', () => {
    const window = new CountSlidingWindow(3);
    window.record(true, 0);
    window.record(false, 0);
    window.record(false, 0);
    window.record(true, 0); // evicts the first
    expect(window.total(0)).toBe(3);
    expect(window.failures(0)).toBe(2);
    expect(window.failureRate(0)).toBeCloseTo(2 / 3, 6);
  });

  it('time window evicts outcomes older than the window', () => {
    const window = new TimeSlidingWindow(100);
    window.record(false, 0);
    window.record(false, 50);
    expect(window.total(50)).toBe(2);
    expect(window.total(200)).toBe(0);
  });
});

/* --------------------------------- registries --------------------------------- */

describe('registries', () => {
  it('policy registry seeds default and resolves', () => {
    const registry = new CircuitPolicyRegistry();
    expect(registry.has('default')).toBe(true);
    registry.register(createCircuitPolicy({ name: 'strict', failureThreshold: 1 }));
    expect(registry.resolve('strict').failureThreshold).toBe(1);
    expect(() => registry.resolve('nope')).toThrow(/Unknown circuit policy/);
  });

  it('circuit registry is get-or-create and notifies listeners', () => {
    const events: CircuitEvent[] = [];
    const registry = new CircuitRegistry({ clock: makeClock().now });
    registry.onEvent((event) => events.push(event));
    const a = registry.getOrCreate('svc', DEFAULT_CIRCUIT_POLICY);
    const again = registry.getOrCreate('svc', DEFAULT_CIRCUIT_POLICY);
    expect(a).toBe(again);
    expect(registry.size).toBe(1);
    a.forceOpen();
    expect(events.some((e) => e.type === 'STATE_CHANGED')).toBe(true);
  });
});

/* --------------------------------- middleware integration --------------------------------- */

class SequenceTransport implements HttpTransport {
  calls = 0;
  constructor(private readonly statuses: readonly number[]) {}
  async send(_req: RawHttpRequest): Promise<RawHttpResponse> {
    const status = this.statuses[Math.min(this.calls, this.statuses.length - 1)]!;
    this.calls += 1;
    const text = JSON.stringify({ status });
    return {
      status,
      statusText: '',
      headers: {},
      text: async () => text,
      arrayBuffer: async () => new TextEncoder().encode(text).buffer,
      stream: () => null,
    };
  }
}

describe('CircuitBreakerEngine middleware (integration)', () => {
  it('opens after repeated failures and short-circuits further calls', async () => {
    const transport = new SequenceTransport([503]);
    const engine = new CircuitBreakerEngine({ clock: makeClock(1000).now });
    const pipeline = MiddlewarePipeline.of(
      engine.middleware({
        policy: createCircuitPolicy({
          failureThreshold: 2,
          minimumThroughput: 2,
          recoveryTimeoutMs: 60_000,
        }),
      }),
    );
    const client = new MiddlewareHttpClient({ transport, pipeline });

    expect((await client.get('https://api.x.com/a')).status).toBe(503);
    expect((await client.get('https://api.x.com/a')).status).toBe(503);
    await expect(client.get('https://api.x.com/a')).rejects.toBeInstanceOf(HttpCircuitOpenError);
    expect(transport.calls).toBe(2); // third call short-circuited
    expect(engine.breaker('api.x.com').state).toBe('OPEN');
  });

  it('keys breakers by host so providers are isolated', async () => {
    const transport = new SequenceTransport([503]);
    const engine = new CircuitBreakerEngine({ clock: makeClock(1000).now });
    const pipeline = MiddlewarePipeline.of(
      engine.middleware({
        policy: createCircuitPolicy({
          failureThreshold: 1,
          minimumThroughput: 1,
          recoveryTimeoutMs: 60_000,
        }),
      }),
    );
    const client = new MiddlewareHttpClient({ transport, pipeline });
    await client.get('https://host-a.com/x'); // opens host-a
    await expect(client.get('https://host-a.com/x')).rejects.toBeInstanceOf(HttpCircuitOpenError);
    expect((await client.get('https://host-b.com/y')).status).toBe(503); // host-b unaffected
    expect(engine.breaker('host-a.com').state).toBe('OPEN');
    expect(engine.breaker('host-b.com').state).toBe('OPEN');
  });
});
