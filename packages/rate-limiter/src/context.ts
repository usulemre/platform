/**
 * `RateLimitContext` — the immutable descriptor of a permit request that travels through the scheduler
 * and into a `Permit`. It carries the weight, priority, correlation id and scope so observers and the
 * Monitoring Module can attribute a wait, a rejection or an admission to a specific request.
 */
export interface RateLimitContext {
  readonly scope: string;
  readonly weight: number;
  /** Higher priority is admitted first. */
  readonly priority: number;
  readonly requestId?: string;
  readonly enqueuedAt: number;
}

export function createRateLimitContext(params: {
  readonly scope: string;
  readonly weight: number;
  readonly priority: number;
  readonly enqueuedAt: number;
  readonly requestId?: string;
}): RateLimitContext {
  return {
    scope: params.scope,
    weight: params.weight,
    priority: params.priority,
    requestId: params.requestId,
    enqueuedAt: params.enqueuedAt,
  };
}
