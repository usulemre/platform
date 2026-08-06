/**
 * The Circuit Breaker Engine — the canonical, provider-independent resiliency component that protects
 * the platform from repeatedly calling unhealthy providers and enables automatic recovery. It provides
 * the full state machine (CLOSED → OPEN → HALF_OPEN → CLOSED, plus FORCED_OPEN / FORCED_CLOSED /
 * DISABLED overrides), sliding-window failure/success tracking (count- or time-based), configurable
 * failure classification (network / timeout / 5xx / connection, optional 429; ignoring validation /
 * auth / business errors), health evaluation, recovery timing, metrics, events and context, a
 * `CircuitBreaker` with a manual reset, the circuit and policy registries, and the `CircuitBreakerEngine`
 * facade with a real circuit-breaker `Middleware` for the HTTP Middleware Pipeline.
 *
 * Every side effect (time) is injected via the `clock` seam, so runs are fully deterministic. Nothing
 * here is provider-specific. `tryAcquire`/`record` are synchronous and atomic within the single
 * JavaScript event loop.
 */
export * from './state';
export * from './window';
export * from './policy';
export * from './classification';
export * from './trackers';
export * from './health';
export * from './recovery';
export * from './metrics';
export * from './events';
export * from './context';
export * from './state-machine';
export * from './breaker';
export * from './registry';
export * from './engine';
