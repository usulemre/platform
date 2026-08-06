import { describe, it, expect } from 'vitest';
import {
  ConstantBackoff,
  DecorrelatedJitter,
  ExponentialBackoff,
  HttpHeaders,
  HttpRequestBuilder,
  HttpTimeoutError,
  HttpTransportError,
  LinearBackoff,
  ManualScheduler,
  MiddlewareHttpClient,
  MiddlewarePipeline,
  RetryDecisionEngine,
  RetryEngine,
  RetryExecutor,
  RetryMetrics,
  RetryPolicyRegistry,
  TimeoutManager,
  classifyOutcome,
  createRetryContext,
  createRetryPolicy,
  effectiveTimeout,
  withJitter,
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

/** Deterministic mulberry32 RNG factory. */
function rng(seed = 0x12345678): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------------- backoff --------------------------------- */

describe('backoff strategies (deterministic)', () => {
  it('constant / linear / exponential with caps', () => {
    expect(new ConstantBackoff(50).delay(3, 0, Math.random)).toBe(50);
    const linear = new LinearBackoff(100, 50, 250);
    expect([1, 2, 3, 4].map((a) => linear.delay(a, 0, Math.random))).toEqual([100, 150, 200, 250]);
    const exp = new ExponentialBackoff(100, 2, 5000);
    expect([1, 2, 3, 10].map((a) => exp.delay(a, 0, Math.random))).toEqual([100, 200, 400, 5000]);
  });

  it('full / equal jitter stay within bounds and are seeded', () => {
    const base = new ConstantBackoff(1000);
    const full = withJitter(base, 'full');
    const equal = withJitter(base, 'equal');
    const r = rng();
    for (let i = 0; i < 20; i += 1) {
      const f = full.delay(1, 0, r);
      const e = equal.delay(1, 0, r);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1000);
      expect(e).toBeGreaterThanOrEqual(500);
      expect(e).toBeLessThanOrEqual(1000);
    }
    // reproducible with the same seed
    expect(withJitter(base, 'full').delay(1, 0, rng(5))).toBe(
      withJitter(base, 'full').delay(1, 0, rng(5)),
    );
  });

  it('decorrelated jitter uses the previous delay', () => {
    const dj = new DecorrelatedJitter(100, 10000);
    const value = dj.delay(2, 400, rng(1));
    expect(value).toBeGreaterThanOrEqual(100); // >= base
    expect(value).toBeLessThanOrEqual(1200); // <= prev*3
  });
});

/* --------------------------------- classification & decision --------------------------------- */

describe('classification & decision', () => {
  it('classifies responses and errors', () => {
    expect(classifyOutcome({ response: resp(200) }).category).toBe('success');
    expect(classifyOutcome({ response: resp(429) }).category).toBe('rate-limit');
    expect(classifyOutcome({ response: resp(503) }).category).toBe('server');
    expect(classifyOutcome({ response: resp(404) }).category).toBe('client');
    expect(classifyOutcome({ error: new HttpTransportError('x', REQ) }).category).toBe('network');
    expect(classifyOutcome({ error: new HttpTimeoutError(REQ, 100) }).category).toBe('timeout');
  });

  it('decides retry vs stop per policy', () => {
    const engine = new RetryDecisionEngine();
    const policy = createRetryPolicy({ maxRetries: 2, backoff: new ConstantBackoff(10) });
    const ctx = createRetryContext({
      requestId: 'r',
      policyName: 'p',
      maxRetries: 2,
      startedAt: 0,
    });
    expect(engine.decide(policy, ctx, { response: resp(503) }, Math.random).shouldRetry).toBe(true);
    expect(engine.decide(policy, ctx, { response: resp(404) }, Math.random).shouldRetry).toBe(
      false,
    );
    expect(engine.decide(policy, ctx, { response: resp(200) }, Math.random).reason).toBe('success');
    expect(
      engine.decide(policy, ctx, { error: new HttpTimeoutError(REQ, 5) }, Math.random).shouldRetry,
    ).toBe(true);
    // exhausted at the budget
    const exhaustedCtx = { ...ctx, attempt: 2 };
    expect(engine.decide(policy, exhaustedCtx, { response: resp(503) }, Math.random).reason).toBe(
      'exhausted',
    );
  });

  it('honors custom conditions and toggles', () => {
    const engine = new RetryDecisionEngine();
    const ctx = createRetryContext({
      requestId: 'r',
      policyName: 'p',
      maxRetries: 3,
      startedAt: 0,
    });
    const noNetwork = createRetryPolicy({ retryOnNetworkError: false });
    expect(
      engine.decide(noNetwork, ctx, { error: new HttpTransportError('x', REQ) }, Math.random)
        .shouldRetry,
    ).toBe(false);
    const force404 = createRetryPolicy({
      conditions: [(_o, c) => (c.status === 404 ? true : undefined)],
    });
    expect(engine.decide(force404, ctx, { response: resp(404) }, Math.random).shouldRetry).toBe(
      true,
    );
  });
});

/* --------------------------------- executor --------------------------------- */

function executor(metrics?: RetryMetrics) {
  return new RetryExecutor({ scheduler: new ManualScheduler(), random: rng(), metrics });
}

describe('RetryExecutor', () => {
  it('succeeds on the first attempt without retrying', async () => {
    const result = await executor().execute(async () => resp(200), createRetryPolicy(), {
      request: REQ,
    });
    expect(result.attempts).toBe(1);
    expect(result.retries).toBe(0);
    expect(result.ok).toBe(true);
  });

  it('retries a transient failure then succeeds', async () => {
    let calls = 0;
    const result = await executor().execute(
      async () => {
        calls += 1;
        return calls === 1 ? resp(503) : resp(200);
      },
      createRetryPolicy({ maxRetries: 3, backoff: new ConstantBackoff(20) }),
      { request: REQ },
    );
    expect(calls).toBe(2);
    expect(result.attempts).toBe(2);
    expect(result.retries).toBe(1);
    expect(result.ok).toBe(true);
    expect(result.totalDelayMs).toBe(20);
    expect(result.history.entries()[0]!.retried).toBe(true);
  });

  it('exhausts the budget on a persistent failure', async () => {
    const result = await executor().execute(
      async () => resp(503),
      createRetryPolicy({ maxRetries: 2, backoff: new ConstantBackoff(5) }),
      { request: REQ },
    );
    expect(result.attempts).toBe(3); // 1 + 2 retries
    expect(result.retries).toBe(2);
    expect(result.exhausted).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.outcome.response?.status).toBe(503);
  });

  it('does not retry a non-retryable status', async () => {
    let calls = 0;
    const result = await executor().execute(
      async () => {
        calls += 1;
        return resp(404);
      },
      createRetryPolicy({ maxRetries: 3 }),
      { request: REQ },
    );
    expect(calls).toBe(1);
    expect(result.retries).toBe(0);
  });

  it('retries a network error', async () => {
    let calls = 0;
    const result = await executor().execute(
      async () => {
        calls += 1;
        if (calls === 1) throw new HttpTransportError('reset', REQ);
        return resp(200);
      },
      createRetryPolicy({ maxRetries: 3, backoff: new ConstantBackoff(1) }),
      { request: REQ },
    );
    expect(result.retries).toBe(1);
    expect(result.ok).toBe(true);
  });

  it('records metrics and is deterministic across runs', async () => {
    const policy = createRetryPolicy({ maxRetries: 3, backoff: new DecorrelatedJitter(100, 5000) });
    const run = async () => {
      let calls = 0;
      const exec = new RetryExecutor({ scheduler: new ManualScheduler(), random: rng(99) });
      return exec.execute(
        async () => {
          calls += 1;
          return calls < 3 ? resp(503) : resp(200);
        },
        policy,
        { request: REQ },
      );
    };
    const a = await run();
    const b = await run();
    expect(a.history.entries().map((e) => e.delayMs)).toEqual(
      b.history.entries().map((e) => e.delayMs),
    );

    const metrics = new RetryMetrics();
    let n = 0;
    await executor(metrics).execute(
      async () => {
        n += 1;
        return n < 2 ? resp(503) : resp(200);
      },
      createRetryPolicy({ backoff: new ConstantBackoff(1) }),
      { request: REQ },
    );
    const snap = metrics.snapshot();
    expect(snap.totalRequests).toBe(1);
    expect(snap.successAfterRetry).toBe(1);
    expect(snap.retriedRequests).toBe(1);
  });

  it('stops immediately when the request is already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    const result = await executor().execute(
      async () => {
        calls += 1;
        return resp(200);
      },
      createRetryPolicy(),
      { request: REQ, signal: controller.signal },
    );
    expect(calls).toBe(0);
    expect(result.aborted).toBe(true);
    expect(result.ok).toBe(false);
  });
});

/* --------------------------------- timeout --------------------------------- */

describe('timeout engine', () => {
  it('effectiveTimeout honors overrides and picks the tightest bound', () => {
    expect(effectiveTimeout({ requestTimeoutMs: 1000 })).toBe(1000);
    expect(effectiveTimeout({ requestTimeoutMs: 1000 }, 500)).toBe(500);
    expect(effectiveTimeout({ connectionTimeoutMs: 100, readTimeoutMs: 200 })).toBe(300);
    expect(
      effectiveTimeout({ requestTimeoutMs: 1000, connectionTimeoutMs: 100, readTimeoutMs: 100 }),
    ).toBe(200);
    expect(effectiveTimeout({})).toBeUndefined();
  });

  it('raises HttpTimeoutError when an operation exceeds its timeout', async () => {
    const scheduler = new ManualScheduler({ autoAdvanceSleep: false });
    const tm = new TimeoutManager(scheduler);
    const hang = (signal: AbortSignal | undefined) =>
      new Promise<string>((_resolve, reject) =>
        signal?.addEventListener('abort', () => reject(new Error('aborted'))),
      );
    const promise = tm.run(hang, 100, REQ);
    scheduler.advance(100);
    await expect(promise).rejects.toBeInstanceOf(HttpTimeoutError);
  });

  it('returns normally when the operation completes before the timeout', async () => {
    const tm = new TimeoutManager(new ManualScheduler({ autoAdvanceSleep: false }));
    await expect(tm.run(async () => 'done', 100, REQ)).resolves.toBe('done');
  });
});

/* --------------------------------- registry & engine integration --------------------------------- */

describe('RetryPolicyRegistry', () => {
  it('seeds default/no-retry and resolves by name', () => {
    const registry = new RetryPolicyRegistry();
    expect(registry.has('default')).toBe(true);
    expect(registry.has('no-retry')).toBe(true);
    expect(registry.resolve().name).toBe('default');
    expect(registry.resolve('no-retry').maxRetries).toBe(0);
    registry.register(createRetryPolicy({ name: 'aggressive', maxRetries: 10 }));
    expect(registry.resolve('aggressive').maxRetries).toBe(10);
    expect(() => registry.resolve('nope')).toThrow(/Unknown retry policy/);
  });
});

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

describe('RetryEngine middleware (integration)', () => {
  it('retries through the middleware pipeline and succeeds', async () => {
    const transport = new SequenceTransport([503, 503, 200]);
    const engine = new RetryEngine({ scheduler: new ManualScheduler(), random: rng() });
    const pipeline = MiddlewarePipeline.of(
      engine.middleware({
        policy: createRetryPolicy({ maxRetries: 3, backoff: new ConstantBackoff(5) }),
      }),
    );
    const client = new MiddlewareHttpClient({ transport, pipeline });
    const res = await client.get<{ status: number }>('https://api.x.com/v1/ping');
    expect(res.status).toBe(200);
    expect(transport.calls).toBe(3);
    expect(engine.metrics.snapshot().successAfterRetry).toBe(1);
  });

  it('does not retry under the no-retry policy', async () => {
    const transport = new SequenceTransport([503]);
    const engine = new RetryEngine({ scheduler: new ManualScheduler(), random: rng() });
    const pipeline = MiddlewarePipeline.of(engine.middleware({ policy: 'no-retry' }));
    const client = new MiddlewareHttpClient({ transport, pipeline });
    const res = await client.get('https://api.x.com/v1/ping');
    expect(res.status).toBe(503);
    expect(transport.calls).toBe(1);
  });
});
