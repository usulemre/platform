/**
 * `RateLimiterEngine` — the facade that owns a `RateLimiterRegistry` (one limiter per scope key), a
 * `RateLimitPolicyRegistry`, a `QuotaManager`, and the integration with the HTTP Middleware Pipeline.
 * `middleware()` returns a real rate-limit `Middleware` (replacing the Phase 8.1.2 placeholder) that
 * keys a limiter by the configured scope, waits for a permit (queuing under backpressure), runs the
 * request, then releases the permit. It composes with the Retry, Timeout and Circuit Breaker engines.
 * Deterministic when constructed with a controllable `Scheduler`.
 */
import {
  MiddlewarePriority,
  MiddlewareResult,
  RATE_LIMIT_MIDDLEWARE,
  SystemScheduler,
  type HttpRequest,
  type Middleware,
  type MiddlewareContext,
  type MiddlewareNext,
  type Scheduler,
} from '@platform/http-client';
import { HttpRateLimitError } from '@platform/http-client';
import { isRateLimitRejected } from './errors';
import { RateLimiterRegistry, RateLimitPolicyRegistry } from './registry';
import { QuotaManager } from './quota';
import { RATE_LIMIT_SCOPES, type RateLimitPolicy, type RateLimitScope } from './policy';
import type { RateLimiter } from './limiter';

function metaString(request: HttpRequest, key: string): string | undefined {
  const value = request.metadata[key];
  return typeof value === 'string' ? value : undefined;
}
function metaNumber(request: HttpRequest, key: string): number | undefined {
  const value = request.metadata[key];
  return typeof value === 'number' ? value : undefined;
}
function host(request: HttpRequest): string {
  try {
    return new URL(request.url).host;
  } catch {
    return request.url;
  }
}

/** Derive the limiter key for a request under a scope (reading request metadata where needed). */
export function scopeKeyFor(scope: RateLimitScope, request: HttpRequest): string {
  switch (scope) {
    case 'GLOBAL':
      return 'global';
    case 'PROVIDER':
      return host(request);
    case 'ENDPOINT': {
      try {
        const url = new URL(request.url);
        return `${url.host}${url.pathname}`;
      } catch {
        return request.url;
      }
    }
    case 'ACCOUNT':
      return `account:${metaString(request, 'account') ?? 'default'}`;
    case 'API_KEY':
      return `apikey:${metaString(request, 'apiKey') ?? 'default'}`;
    case 'SYMBOL':
      return `symbol:${metaString(request, 'symbol') ?? 'default'}`;
    case 'REQUEST_TYPE':
      return `type:${metaString(request, 'requestType') ?? request.method}`;
    default: {
      const exhaustive: never = scope;
      return exhaustive;
    }
  }
}

export interface RateLimiterEngineConfig {
  readonly scheduler?: Scheduler;
  readonly policies?: RateLimitPolicyRegistry;
}

export interface RateLimitMiddlewareOptions {
  readonly scope?: RateLimitScope;
  /** Override the keying entirely (takes precedence over `scope`). */
  readonly key?: (request: HttpRequest) => string;
  readonly policy?: string | RateLimitPolicy;
  readonly name?: string;
  readonly priority?: number;
  readonly maxWaitMs?: number;
}

export class RateLimiterEngine {
  readonly limiters: RateLimiterRegistry;
  readonly policies: RateLimitPolicyRegistry;
  readonly quotas: QuotaManager;
  private readonly scheduler: Scheduler;

  constructor(config: RateLimiterEngineConfig = {}) {
    this.scheduler = config.scheduler ?? new SystemScheduler();
    this.policies = config.policies ?? new RateLimitPolicyRegistry();
    this.limiters = new RateLimiterRegistry({ scheduler: this.scheduler });
    this.quotas = new QuotaManager(this.limiters, () => this.scheduler.now());
  }

  /** Get (or lazily create) the limiter for a key under a policy. */
  limiter(key: string, policy?: string | RateLimitPolicy): RateLimiter {
    return this.limiters.getOrCreate(key, this.policies.resolve(policy));
  }

  /** The scopes supported by the engine (broadest to narrowest). */
  scopes(): readonly RateLimitScope[] {
    return RATE_LIMIT_SCOPES;
  }

  /** Build the rate-limit middleware for the HTTP Middleware Pipeline. */
  middleware(options: RateLimitMiddlewareOptions = {}): Middleware {
    const policy = this.policies.resolve(options.policy);
    const scope = options.scope ?? policy.scope;
    const key = options.key ?? ((request: HttpRequest) => scopeKeyFor(scope, request));
    const handle = async (
      context: MiddlewareContext,
      next: MiddlewareNext,
    ): Promise<MiddlewareResult> => {
      const scopeKey = key(context.request);
      const limiter = this.limiters.getOrCreate(scopeKey, policy);
      let permit;
      try {
        permit = await limiter.acquire({
          weight: metaNumber(context.request, 'rateLimitWeight'),
          priority: metaNumber(context.request, 'rateLimitPriority') ?? 0,
          maxWaitMs: options.maxWaitMs,
          signal: context.signal,
          requestId: context.request.context.requestId,
        });
      } catch (error) {
        const reason = isRateLimitRejected(error) ? error.reason : 'aborted';
        const retryAfterMs = isRateLimitRejected(error) ? error.retryAfterMs : 0;
        return MiddlewareResult.error(
          new HttpRateLimitError(context.request, scopeKey, reason, retryAfterMs),
        );
      }
      try {
        return await next(context);
      } finally {
        permit.release();
      }
    };
    return {
      name: options.name ?? RATE_LIMIT_MIDDLEWARE,
      priority: options.priority ?? MiddlewarePriority.RATE_LIMIT,
      handle,
    };
  }
}
