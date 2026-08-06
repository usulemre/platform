/**
 * `RetryExecutor` — the orchestration heart of the engine. It runs an operation, applies the per-
 * attempt timeout, classifies the outcome, consults the decision engine, waits the backoff delay, and
 * repeats until the decision says stop. Every side effect (time, delay, randomness) is injected, so a
 * run is fully deterministic and reproducible. It records a `RetryHistory` and feeds `RetryMetrics`.
 */
import { HttpAbortError, HttpTransportError, isHttpError, type HttpError } from '../errors';
import { classifyOutcome, type RetryCategory, type RetryOutcome } from './classify';
import { advanceRetryContext, createRetryContext } from './context';
import { RetryDecisionEngine, type RetryDecision } from './decision';
import { RetryHistory } from './history';
import { effectiveTimeout, TimeoutManager, type TimeoutPolicy } from './timeout';
import { SleepAbortedError, type Scheduler } from './scheduler';
import type { Random } from './backoff';
import type { RetryMetricsRecorder } from './metrics';
import type { RetryPolicy } from './policy';
import type { HttpRequest } from '../request';
import type { HttpResponse } from '../response';

/** The operation the executor retries. It receives the attempt index and the (timeout) signal. */
export type RetryOperation<T = unknown> = (
  attempt: number,
  signal: AbortSignal | undefined,
) => Promise<HttpResponse<T>>;

/** The complete outcome of a retried operation. */
export interface RetryResult<T = unknown> {
  readonly outcome: RetryOutcome<T>;
  /** The final outcome is a response (of any status). */
  readonly succeeded: boolean;
  /** The final outcome is a 2xx response. */
  readonly ok: boolean;
  readonly attempts: number;
  readonly retries: number;
  /** Stopped because the retry budget was exhausted while the outcome was still retryable. */
  readonly exhausted: boolean;
  /** Stopped because the request was cancelled. */
  readonly aborted: boolean;
  readonly category: RetryCategory;
  readonly history: RetryHistory;
  readonly totalDelayMs: number;
  readonly totalDurationMs: number;
}

export interface RetryExecutorDeps {
  readonly scheduler: Scheduler;
  readonly random: Random;
  readonly timeoutManager?: TimeoutManager;
  readonly decisionEngine?: RetryDecisionEngine;
  readonly metrics?: RetryMetricsRecorder;
}

export interface RetryExecuteOptions {
  /** The request (used to construct timeout/abort errors and correlation). */
  readonly request: HttpRequest;
  readonly timeoutPolicy?: TimeoutPolicy;
  /** A per-request timeout override (ms). */
  readonly timeoutOverrideMs?: number;
  readonly signal?: AbortSignal;
}

function toHttpError(error: unknown, request: HttpRequest): HttpError {
  if (isHttpError(error)) return error;
  if (error instanceof SleepAbortedError) return new HttpAbortError(request, error);
  return new HttpTransportError('The retried operation failed.', request, error);
}

export class RetryExecutor {
  private readonly scheduler: Scheduler;
  private readonly random: Random;
  private readonly timeoutManager: TimeoutManager;
  private readonly decisionEngine: RetryDecisionEngine;
  private readonly metrics?: RetryMetricsRecorder;

  constructor(deps: RetryExecutorDeps) {
    this.scheduler = deps.scheduler;
    this.random = deps.random;
    this.timeoutManager = deps.timeoutManager ?? new TimeoutManager(deps.scheduler);
    this.decisionEngine = deps.decisionEngine ?? new RetryDecisionEngine();
    this.metrics = deps.metrics;
  }

  async execute<T = unknown>(
    operation: RetryOperation<T>,
    policy: RetryPolicy,
    options: RetryExecuteOptions,
  ): Promise<RetryResult<T>> {
    const { request } = options;
    const timeoutMs = effectiveTimeout(options.timeoutPolicy ?? {}, options.timeoutOverrideMs);
    let context = createRetryContext({
      requestId: request.context.requestId,
      policyName: policy.name,
      maxRetries: policy.maxRetries,
      startedAt: this.scheduler.now(),
    });
    let history = new RetryHistory();
    let totalDelayMs = 0;
    let aborted = false;
    let outcome: RetryOutcome<T> = { error: new HttpAbortError(request) };
    let lastDecision: RetryDecision | undefined;

    for (;;) {
      if (options.signal?.aborted) {
        aborted = true;
        outcome = { error: new HttpAbortError(request) };
        history = history.append({
          attempt: context.attempt + 1,
          category: 'aborted',
          retried: false,
          delayMs: 0,
          durationMs: 0,
          at: this.scheduler.now(),
          reason: 'aborted',
        });
        break;
      }

      const startedAt = this.scheduler.now();
      try {
        const response = await this.timeoutManager.run(
          (signal) => operation(context.attempt, signal),
          timeoutMs,
          request,
          options.signal,
        );
        outcome = { response };
      } catch (error) {
        outcome = { error: toHttpError(error, request) };
      }
      const durationMs = this.scheduler.now() - startedAt;

      const decision = this.decisionEngine.decide(policy, context, outcome, this.random);
      lastDecision = decision;
      history = history.append({
        attempt: context.attempt + 1,
        category: decision.category,
        status: decision.status,
        retried: decision.shouldRetry,
        delayMs: decision.shouldRetry ? decision.delayMs : 0,
        durationMs,
        at: startedAt,
        reason: decision.reason,
      });

      if (!decision.shouldRetry) break;

      try {
        await this.scheduler.sleep(decision.delayMs, options.signal);
      } catch {
        aborted = true;
        outcome = { error: new HttpAbortError(request) };
        break;
      }
      totalDelayMs += decision.delayMs;
      context = advanceRetryContext(context, decision.delayMs);
    }

    const result = this.buildResult(outcome, history, totalDelayMs, lastDecision, aborted);
    this.metrics?.record(result);
    return result;
  }

  private buildResult<T>(
    outcome: RetryOutcome<T>,
    history: RetryHistory,
    totalDelayMs: number,
    lastDecision: RetryDecision | undefined,
    aborted: boolean,
  ): RetryResult<T> {
    const succeeded = outcome.response !== undefined;
    const ok = succeeded && outcome.response!.ok;
    return {
      outcome,
      succeeded,
      ok,
      attempts: history.attempts,
      retries: history.retries,
      exhausted: lastDecision?.reason === 'exhausted',
      aborted,
      category: classifyOutcome(outcome).category,
      history,
      totalDelayMs,
      totalDurationMs: history.totalDurationMs,
    };
  }
}

/** Return the response of a retry result, or throw its final error. */
export function unwrapRetryResult<T>(result: RetryResult<T>): HttpResponse<T> {
  if (result.outcome.error) throw result.outcome.error;
  return result.outcome.response;
}
