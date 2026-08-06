import { bench, describe } from 'vitest';
import {
  CircuitBreaker,
  CountSlidingWindow,
  HealthEvaluator,
  HttpHeaders,
  HttpRequestBuilder,
  HttpTransportError,
  FailureTracker,
  classifyForCircuit,
  createCircuitPolicy,
  type HttpRequest,
  type HttpResponse,
} from '../src/index';

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

const policy = createCircuitPolicy({
  failureThreshold: 5,
  minimumThroughput: 5,
  window: { type: 'count', size: 100 },
});
const successOutcome = { response: resp(200) } as const;
const failureOutcome = { error: new HttpTransportError('x', REQ) } as const;
const health = new HealthEvaluator();
const tracker = new FailureTracker(new CountSlidingWindow(100));
for (let i = 0; i < 100; i += 1) tracker.recordFailure(0);

let clock = 0;

describe('circuit breaker', () => {
  bench('classify outcome for circuit', () => {
    classifyForCircuit(successOutcome, policy);
    classifyForCircuit(failureOutcome, policy);
    classifyForCircuit({ response: resp(404) }, policy);
  });

  bench('health evaluation (100-entry window)', () => {
    health.shouldOpen(tracker, policy, 0);
  });

  bench('acquire + record success (closed)', () => {
    const breaker = new CircuitBreaker('bench', policy, { clock: () => clock });
    const permit = breaker.tryAcquire();
    breaker.record(permit, successOutcome);
  });

  bench('acquire + record failure until open', () => {
    clock += 1;
    const breaker = new CircuitBreaker('bench', policy, { clock: () => clock });
    for (let i = 0; i < 6; i += 1) {
      const permit = breaker.tryAcquire();
      breaker.record(permit, failureOutcome);
    }
  });
});
