/**
 * Middleware priority — the deterministic ordering key for the pipeline. Lower numbers run *earlier*
 * on the way in (outermost) and therefore *later* on the way out. The named tiers give the default
 * placeholders a stable, sensible position; any numeric priority is accepted. Middleware with equal
 * priority preserve insertion order (stable sort).
 */

export const MiddlewarePriority = {
  /** Runs first on the way in / last on the way out. */
  HIGHEST: 0,
  TRACING: 100,
  REQUEST_ID: 200,
  USER_AGENT: 300,
  AUTHENTICATION: 400,
  COMPRESSION: 500,
  LOGGING: 600,
  METRICS: 700,
  RATE_LIMIT: 800,
  CIRCUIT_BREAKER: 900,
  /** Closest to the transport, so it wraps the actual dispatch tightly. */
  RETRY: 1000,
  /** The default when a middleware declares no priority. */
  DEFAULT: 5000,
  /** Runs last on the way in / first on the way out. */
  LOWEST: 10000,
} as const;

export type MiddlewarePriorityValue = number;

/** Resolve a middleware's effective priority (its declared value or the default). */
export function effectivePriority(priority: number | undefined): number {
  return priority ?? MiddlewarePriority.DEFAULT;
}
