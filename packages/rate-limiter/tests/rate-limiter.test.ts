import { describe, it, expect } from 'vitest';
import {
  ManualScheduler,
  MiddlewareHttpClient,
  MiddlewarePipeline,
  MiddlewarePriority,
  HttpRateLimitError,
  type HttpTransport,
  type RawHttpRequest,
  type RawHttpResponse,
} from '@platform/http-client';
import {
  CompositeRateLimiter,
  FixedWindowLimiter,
  LeakyBucketLimiter,
  RateLimiter,
  RateLimiterEngine,
  RateLimiterRegistry,
  RateLimitPolicyRegistry,
  SlidingWindowLimiter,
  TokenBucketLimiter,
  createRateLimitPolicy,
  isRateLimitRejected,
  scopeKeyFor,
} from '../src/index';

/* --------------------------------- helpers --------------------------------- */

async function settled(promise: Promise<unknown>): Promise<boolean> {
  let done = false;
  promise.then(
    () => (done = true),
    () => (done = true),
  );
  await Promise.resolve();
  await Promise.resolve();
  return done;
}

function makeLimiter(init: Parameters<typeof createRateLimitPolicy>[0]): {
  rl: RateLimiter;
  scheduler: ManualScheduler;
} {
  const scheduler = new ManualScheduler({ startAt: 0 });
  return { rl: new RateLimiter('test', createRateLimitPolicy(init), { scheduler }), scheduler };
}

/* --------------------------------- algorithms --------------------------------- */

describe('rate-limit algorithms (deterministic)', () => {
  it('token bucket bursts then refills', () => {
    const tb = new TokenBucketLimiter({ limit: 2, intervalMs: 1000 }, 0); // 2 tokens/sec
    expect(tb.tryAcquire(1, 0).allowed).toBe(true);
    expect(tb.tryAcquire(1, 0).allowed).toBe(true);
    const denied = tb.tryAcquire(1, 0);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterMs).toBe(500); // 1 token / (2/1000 per ms)
    expect(tb.tryAcquire(1, 500).allowed).toBe(true); // refilled
  });

  it('token bucket honors weight', () => {
    const tb = new TokenBucketLimiter({ limit: 10, intervalMs: 1000, burst: 10 }, 0);
    expect(tb.tryAcquire(6, 0).allowed).toBe(true);
    expect(tb.tryAcquire(6, 0).allowed).toBe(false);
    expect(tb.tryAcquire(4, 0).allowed).toBe(true);
  });

  it('leaky bucket admits within capacity and drains', () => {
    const lb = new LeakyBucketLimiter({ limit: 1, intervalMs: 1000, burst: 2 }, 0); // leaks 1/sec, holds 2
    expect(lb.tryAcquire(1, 0).allowed).toBe(true);
    expect(lb.tryAcquire(1, 0).allowed).toBe(true);
    expect(lb.tryAcquire(1, 0).allowed).toBe(false);
    expect(lb.tryAcquire(1, 1000).allowed).toBe(true); // one leaked out
  });

  it('fixed window resets at the boundary', () => {
    const fw = new FixedWindowLimiter({ limit: 2, intervalMs: 1000 }, 0);
    expect(fw.tryAcquire(1, 10).allowed).toBe(true);
    expect(fw.tryAcquire(1, 20).allowed).toBe(true);
    expect(fw.tryAcquire(1, 30).allowed).toBe(false);
    expect(fw.tryAcquire(1, 1000).allowed).toBe(true); // next window
  });

  it('sliding window rolls continuously', () => {
    const sw = new SlidingWindowLimiter({ limit: 2, intervalMs: 1000 });
    expect(sw.tryAcquire(1, 0).allowed).toBe(true);
    expect(sw.tryAcquire(1, 500).allowed).toBe(true);
    expect(sw.tryAcquire(1, 900).allowed).toBe(false);
    expect(sw.tryAcquire(1, 1001).allowed).toBe(true); // first entry (t=0) evicted
  });
});

/* --------------------------------- limiter: waiting / concurrency / priority --------------------------------- */

describe('RateLimiter admission', () => {
  it('admits immediately, then queues and wakes on rate refill', async () => {
    const { rl, scheduler } = makeLimiter({
      algorithm: 'token-bucket',
      params: { limit: 2, intervalMs: 1000 },
    });
    await rl.acquire();
    await rl.acquire(); // tokens exhausted
    const pending = rl.acquire();
    expect(await settled(pending)).toBe(false);
    scheduler.advance(500); // refill one token
    const permit = await pending;
    expect(permit.released).toBe(false);
  });

  it('limits concurrency and releases on permit.release()', async () => {
    const { rl } = makeLimiter({
      algorithm: 'token-bucket',
      params: { limit: 100, intervalMs: 1000 },
      maxConcurrent: 1,
    });
    const first = await rl.acquire();
    const pending = rl.acquire();
    expect(await settled(pending)).toBe(false);
    first.release();
    expect((await pending).released).toBe(false);
  });

  it('admits higher priority first', async () => {
    const { rl } = makeLimiter({
      algorithm: 'token-bucket',
      params: { limit: 100, intervalMs: 1000 },
      maxConcurrent: 1,
    });
    const first = await rl.acquire();
    const order: string[] = [];
    const low = rl.acquire({ priority: 1 }).then((p) => {
      order.push('low');
      p.release();
    });
    const high = rl.acquire({ priority: 10 }).then((p) => {
      order.push('high');
      p.release();
    });
    first.release();
    await Promise.all([low, high]);
    expect(order[0]).toBe('high');
  });

  it('applies backpressure when the queue is full', async () => {
    const { rl } = makeLimiter({
      algorithm: 'token-bucket',
      params: { limit: 1, intervalMs: 1000 },
      maxConcurrent: 1,
      maxQueue: 1,
    });
    await rl.acquire();
    const queued = rl.acquire();
    void settled(queued);
    const overflow = rl.acquire();
    await expect(overflow).rejects.toSatisfy(
      (e: unknown) => isRateLimitRejected(e) && e.reason === 'queue-full',
    );
  });

  it('rejects on wait-deadline timeout', async () => {
    const { rl, scheduler } = makeLimiter({
      algorithm: 'token-bucket',
      params: { limit: 100, intervalMs: 1000 },
      maxConcurrent: 1,
    });
    await rl.acquire();
    const queued = rl.acquire({ maxWaitMs: 100 });
    scheduler.advance(100);
    await expect(queued).rejects.toSatisfy(
      (e: unknown) => isRateLimitRejected(e) && e.reason === 'timeout',
    );
  });

  it('rejects on cancellation', async () => {
    const { rl } = makeLimiter({
      algorithm: 'token-bucket',
      params: { limit: 100, intervalMs: 1000 },
      maxConcurrent: 1,
    });
    await rl.acquire();
    const controller = new AbortController();
    const queued = rl.acquire({ signal: controller.signal });
    controller.abort();
    await expect(queued).rejects.toSatisfy(
      (e: unknown) => isRateLimitRejected(e) && e.reason === 'aborted',
    );
  });

  it('supports non-blocking tryAcquire and execute', async () => {
    const { rl } = makeLimiter({
      algorithm: 'token-bucket',
      params: { limit: 3, intervalMs: 1000 },
    });
    const attempt = rl.tryAcquire();
    expect(attempt.allowed).toBe(true);
    attempt.permit!.release();
    expect(await rl.execute(async () => 'ok')).toBe('ok');
  });

  it('applies dynamic quota updates to unblock waiters', async () => {
    const { rl } = makeLimiter({
      algorithm: 'token-bucket',
      params: { limit: 100, intervalMs: 1000 },
      maxConcurrent: 1,
    });
    await rl.acquire();
    const pending = rl.acquire();
    expect(await settled(pending)).toBe(false);
    rl.updateQuota({ maxConcurrent: 2 });
    expect((await pending).released).toBe(false);
  });

  it('reports metrics', async () => {
    const { rl, scheduler } = makeLimiter({
      algorithm: 'token-bucket',
      params: { limit: 1, intervalMs: 1000 },
    });
    await rl.acquire();
    const pending = rl.acquire();
    scheduler.advance(1000);
    await pending;
    const metrics = rl.metricsSnapshot();
    expect(metrics.acquired).toBe(2);
    expect(metrics.admittedImmediately).toBe(1);
    expect(metrics.admittedAfterWait).toBe(1);
  });
});

/* --------------------------------- composite --------------------------------- */

describe('CompositeRateLimiter', () => {
  it('requires a permit from every limiter', async () => {
    const scheduler = new ManualScheduler({ startAt: 0 });
    const global = new RateLimiter(
      'global',
      createRateLimitPolicy({ params: { limit: 5, intervalMs: 1000 } }),
      { scheduler },
    );
    const provider = new RateLimiter(
      'provider',
      createRateLimitPolicy({ params: { limit: 1, intervalMs: 1000 } }),
      { scheduler },
    );
    const composite = new CompositeRateLimiter([global, provider]);
    await composite.acquire();
    const pending = composite.acquire();
    expect(await settled(pending)).toBe(false); // provider limit reached
    scheduler.advance(1000);
    const permit = await pending;
    permit.release();
    expect(permit.released).toBe(true);
  });
});

/* --------------------------------- registry & scope keys --------------------------------- */

describe('registries and scope keys', () => {
  it('policy registry seeds default and resolves', () => {
    const registry = new RateLimitPolicyRegistry();
    expect(registry.has('default')).toBe(true);
    registry.register(
      createRateLimitPolicy({ name: 'burst', params: { limit: 100, intervalMs: 1000 } }),
    );
    expect(registry.resolve('burst').params.limit).toBe(100);
    expect(() => registry.resolve('nope')).toThrow(/Unknown rate-limit policy/);
  });

  it('limiter registry is get-or-create', () => {
    const registry = new RateLimiterRegistry({ scheduler: new ManualScheduler() });
    const a = registry.getOrCreate('svc', createRateLimitPolicy());
    expect(registry.getOrCreate('svc', createRateLimitPolicy())).toBe(a);
    expect(registry.size).toBe(1);
  });

  it('derives scope keys from a request', () => {
    const request = {
      url: 'https://api.exchange.com/v1/orders',
      method: 'POST',
      metadata: { symbol: 'BTCUSDT', account: 'acct-1' },
    } as never;
    expect(scopeKeyFor('GLOBAL', request)).toBe('global');
    expect(scopeKeyFor('PROVIDER', request)).toBe('api.exchange.com');
    expect(scopeKeyFor('ENDPOINT', request)).toBe('api.exchange.com/v1/orders');
    expect(scopeKeyFor('SYMBOL', request)).toBe('symbol:BTCUSDT');
    expect(scopeKeyFor('ACCOUNT', request)).toBe('account:acct-1');
    expect(scopeKeyFor('REQUEST_TYPE', request)).toBe('type:POST');
  });
});

/* --------------------------------- middleware integration --------------------------------- */

class OkTransport implements HttpTransport {
  calls = 0;
  async send(_req: RawHttpRequest): Promise<RawHttpResponse> {
    this.calls += 1;
    const text = '{"ok":true}';
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      text: async () => text,
      arrayBuffer: async () => new TextEncoder().encode(text).buffer,
      stream: () => null,
    };
  }
}

describe('RateLimiterEngine middleware (integration)', () => {
  it('throttles requests through the pipeline', async () => {
    const scheduler = new ManualScheduler({ startAt: 0 });
    const transport = new OkTransport();
    const engine = new RateLimiterEngine({ scheduler });
    const middleware = engine.middleware({
      policy: createRateLimitPolicy({
        algorithm: 'token-bucket',
        params: { limit: 2, intervalMs: 1000 },
        scope: 'PROVIDER',
      }),
    });
    expect(middleware.priority).toBe(MiddlewarePriority.RATE_LIMIT);
    const client = new MiddlewareHttpClient({
      transport,
      pipeline: MiddlewarePipeline.of(middleware),
      clock: () => scheduler.now(),
    });

    const p1 = client.get('https://api.x.com/a');
    const p2 = client.get('https://api.x.com/a');
    const p3 = client.get('https://api.x.com/a');
    await Promise.all([p1, p2]);
    expect(transport.calls).toBe(2); // third is throttled

    scheduler.advance(500); // refill one token
    await p3;
    expect(transport.calls).toBe(3);
  });

  it('rejects with HttpRateLimitError under backpressure', async () => {
    const scheduler = new ManualScheduler({ startAt: 0 });
    const engine = new RateLimiterEngine({ scheduler });
    // Rate is generous; concurrency (1) + queue (1) are the binding constraints.
    const middleware = engine.middleware({
      policy: createRateLimitPolicy({
        algorithm: 'token-bucket',
        params: { limit: 1000, intervalMs: 1000 },
        maxConcurrent: 1,
        maxQueue: 1,
      }),
    });
    const client = new MiddlewareHttpClient({
      transport: new OkTransport(),
      pipeline: MiddlewarePipeline.of(middleware),
      clock: () => scheduler.now(),
    });
    const inflight = client.get('https://api.x.com/a'); // holds the only concurrency slot
    const queued = client.get('https://api.x.com/a'); // fills the queue
    await expect(client.get('https://api.x.com/a')).rejects.toBeInstanceOf(HttpRateLimitError);
    await Promise.allSettled([inflight, queued]);
  });
});
