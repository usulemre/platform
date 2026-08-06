/**
 * `RetryEngine` — the facade that ties the pieces together: a policy registry, a `RetryExecutor` wired
 * with an injected scheduler/random, retry metrics, and the integration with the HTTP Middleware
 * Pipeline. `middleware()` returns a real retry `Middleware` (replacing the Phase 8.1.2 placeholder)
 * that wraps `next` with retry, per-attempt timeout and backoff — providers opt in by adding it to
 * their pipeline. Deterministic when constructed with a seeded random and a controllable scheduler.
 */
import {
  MiddlewarePriority,
  MiddlewareResult,
  type Middleware,
  type MiddlewareContext,
  type MiddlewareNext,
} from '../middleware';
import { RETRY_MIDDLEWARE } from '../middleware/placeholders';
import {
  RetryExecutor,
  type RetryExecuteOptions,
  type RetryOperation,
  type RetryResult,
} from './executor';
import { RetryMetrics } from './metrics';
import { RetryPolicyRegistry } from './registry';
import { SystemScheduler, type Scheduler } from './scheduler';
import type { Random } from './backoff';
import type { RetryPolicy } from './policy';
import type { TimeoutPolicy } from './timeout';
import type { HttpRequest } from '../request';

export interface RetryEngineConfig {
  readonly scheduler?: Scheduler;
  readonly random?: Random;
  readonly policies?: RetryPolicyRegistry;
  readonly metrics?: RetryMetrics;
}

export interface RetryMiddlewareOptions {
  readonly policy?: string | RetryPolicy;
  readonly timeoutPolicy?: TimeoutPolicy;
  readonly name?: string;
  readonly priority?: number;
}

/** Reads a per-request timeout override from request metadata (`metadata.timeoutMs`). */
function requestTimeoutOverride(request: HttpRequest): number | undefined {
  const value = request.metadata['timeoutMs'];
  return typeof value === 'number' && value > 0 ? value : undefined;
}

function withSignal(request: HttpRequest, signal: AbortSignal | undefined): HttpRequest {
  if (!signal) return request;
  return { ...request, context: { ...request.context, signal } };
}

export class RetryEngine {
  readonly policies: RetryPolicyRegistry;
  readonly metrics: RetryMetrics;
  private readonly executor: RetryExecutor;

  constructor(config: RetryEngineConfig = {}) {
    this.policies = config.policies ?? new RetryPolicyRegistry();
    this.metrics = config.metrics ?? new RetryMetrics();
    this.executor = new RetryExecutor({
      scheduler: config.scheduler ?? new SystemScheduler(),
      random: config.random ?? Math.random,
      metrics: this.metrics,
    });
  }

  /** Run an operation under a retry policy (resolved by name/inline/default). */
  execute<T = unknown>(
    operation: RetryOperation<T>,
    policy: string | RetryPolicy | undefined,
    options: RetryExecuteOptions,
  ): Promise<RetryResult<T>> {
    return this.executor.execute(operation, this.policies.resolve(policy), options);
  }

  /** Build the retry middleware for the HTTP Middleware Pipeline. */
  middleware(options: RetryMiddlewareOptions = {}): Middleware {
    const policy = this.policies.resolve(options.policy);
    const handle = async (
      context: MiddlewareContext,
      next: MiddlewareNext,
    ): Promise<MiddlewareResult> => {
      const operation: RetryOperation = async (_attempt, signal) => {
        const result = await next(context.withRequest(withSignal(context.request, signal)));
        if (result.kind === 'error') throw result.error;
        return result.response;
      };
      const retryResult = await this.execute(operation, policy, {
        request: context.request,
        timeoutPolicy: options.timeoutPolicy,
        timeoutOverrideMs: requestTimeoutOverride(context.request),
        signal: context.signal,
      });
      return retryResult.outcome.error
        ? MiddlewareResult.error(retryResult.outcome.error)
        : MiddlewareResult.response(retryResult.outcome.response);
    };
    return {
      name: options.name ?? RETRY_MIDDLEWARE,
      priority: options.priority ?? MiddlewarePriority.RETRY,
      handle,
    };
  }
}
