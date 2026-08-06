/**
 * `CircuitBreakerEngine` — the facade that owns a `CircuitRegistry` (one breaker per provider key), a
 * `CircuitPolicyRegistry`, and the integration with the HTTP Middleware Pipeline. `middleware()`
 * returns a real circuit-breaker `Middleware` (replacing the Phase 8.1.2 placeholder) that keys a
 * breaker by request host, short-circuits when the breaker is open, and records every outcome. It
 * composes cleanly with the Retry & Timeout Engine (place the breaker outside retry to fail fast).
 * Deterministic when constructed with a controllable clock.
 */
import {
  MiddlewarePriority,
  MiddlewareResult,
  type Middleware,
  type MiddlewareContext,
  type MiddlewareNext,
} from '../middleware';
import { CIRCUIT_BREAKER_MIDDLEWARE } from '../middleware/placeholders';
import { HttpCircuitOpenError } from '../errors';
import { CircuitBreaker } from './breaker';
import type { Clock } from '../client';
import { CircuitRegistry, CircuitPolicyRegistry } from './registry';
import type { CircuitEventListener } from './events';
import type { CircuitPolicy } from './policy';
import type { HttpRequest } from '../request';
import type { RetryOutcome } from '../retry/classify';

/** Derive the breaker key for a request (its host, falling back to the full URL). */
export function providerKey(request: HttpRequest): string {
  try {
    return new URL(request.url).host;
  } catch {
    return request.url;
  }
}

export interface CircuitBreakerEngineConfig {
  readonly clock?: Clock;
  readonly policies?: CircuitPolicyRegistry;
}

export interface CircuitMiddlewareOptions {
  /** How to key a request to a breaker (default: the request host). */
  readonly key?: (request: HttpRequest) => string;
  readonly policy?: string | CircuitPolicy;
  readonly name?: string;
  readonly priority?: number;
}

export class CircuitBreakerEngine {
  readonly circuits: CircuitRegistry;
  readonly policies: CircuitPolicyRegistry;

  constructor(config: CircuitBreakerEngineConfig = {}) {
    this.policies = config.policies ?? new CircuitPolicyRegistry();
    this.circuits = new CircuitRegistry({ clock: config.clock });
  }

  /** Get (or lazily create) the breaker for `name` under a policy. */
  breaker(name: string, policy?: string | CircuitPolicy): CircuitBreaker {
    return this.circuits.getOrCreate(name, this.policies.resolve(policy));
  }

  /** Subscribe to every breaker's events (existing and future). */
  onEvent(listener: CircuitEventListener): () => void {
    return this.circuits.onEvent(listener);
  }

  /** Build the circuit-breaker middleware for the HTTP Middleware Pipeline. */
  middleware(options: CircuitMiddlewareOptions = {}): Middleware {
    const key = options.key ?? providerKey;
    const policy = this.policies.resolve(options.policy);
    const handle = async (
      context: MiddlewareContext,
      next: MiddlewareNext,
    ): Promise<MiddlewareResult> => {
      const breaker = this.circuits.getOrCreate(key(context.request), policy);
      const permit = breaker.tryAcquire();
      if (!permit.allowed)
        return MiddlewareResult.error(
          new HttpCircuitOpenError(context.request, breaker.name, permit.state),
        );
      const result = await next(context);
      const outcome: RetryOutcome =
        result.kind === 'response' ? { response: result.response } : { error: result.error };
      breaker.record(permit, outcome);
      return result;
    };
    return {
      name: options.name ?? CIRCUIT_BREAKER_MIDDLEWARE,
      priority: options.priority ?? MiddlewarePriority.CIRCUIT_BREAKER,
      handle,
    };
  }
}
