import { bench, describe } from 'vitest';
import {
  ConstantBackoff,
  DecorrelatedJitter,
  ExponentialBackoff,
  HttpHeaders,
  HttpRequestBuilder,
  ManualScheduler,
  RetryDecisionEngine,
  RetryExecutor,
  classifyOutcome,
  createRetryContext,
  createRetryPolicy,
  withJitter,
  type HttpRequest,
  type HttpResponse,
} from '../src/index';

/** Deterministic mulberry32 RNG (no Math.random — reproducible). */
function rng(seed = 0x9e3779b9): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

const exp = new ExponentialBackoff(100, 2, 5000);
const jitter = withJitter(exp, 'equal');
const decorrelated = new DecorrelatedJitter(100, 5000);
const random = rng();
const decisionEngine = new RetryDecisionEngine();
const policy = createRetryPolicy({ maxRetries: 3, backoff: new ConstantBackoff(0) });
const ctx = createRetryContext({ requestId: 'r', policyName: 'p', maxRetries: 3, startedAt: 0 });

describe('retry engine', () => {
  bench('exponential backoff delay', () => {
    for (let a = 1; a <= 10; a += 1) exp.delay(a, 0, random);
  });
  bench('equal-jitter backoff delay', () => {
    for (let a = 1; a <= 10; a += 1) jitter.delay(a, 0, random);
  });
  bench('decorrelated jitter delay', () => {
    let prev = 0;
    for (let a = 1; a <= 10; a += 1) prev = decorrelated.delay(a, prev, random);
  });
  bench('classify outcome', () => {
    classifyOutcome({ response: resp(503) });
    classifyOutcome({ response: resp(200) });
    classifyOutcome({ response: resp(404) });
  });
  bench('retry decision', () => {
    decisionEngine.decide(policy, ctx, { response: resp(503) }, random);
  });
  bench('full executor run (3 retries, immediate scheduler)', async () => {
    const executor = new RetryExecutor({ scheduler: new ManualScheduler(), random: rng() });
    await executor.execute(
      async () => resp(503),
      createRetryPolicy({ maxRetries: 3, backoff: new ConstantBackoff(0) }),
      { request: REQ },
    );
  });
});
