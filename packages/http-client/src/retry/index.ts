/**
 * The Retry & Timeout Engine — the canonical, provider-independent resiliency layer for the Common
 * HTTP Client. It provides deterministic retry policies (max retries, retryable/non-retryable status
 * rules, network/timeout toggles, custom conditions), backoff strategies (constant / linear /
 * exponential / decorrelated jitter, plus full/equal jitter), a per-attempt timeout engine
 * (request/connection/read timeouts with a per-request override and cancellation), outcome
 * classification and a decision engine, retry context/history/metrics, the `RetryExecutor`
 * orchestrator, and the `RetryEngine` facade with a policy registry and a real retry `Middleware` for
 * the HTTP Middleware Pipeline.
 *
 * Every side effect — time, delay and randomness — is injected through the `Scheduler` and `Random`
 * seams, so runs are fully deterministic and reproducible. Nothing here is provider-specific.
 */
export * from './scheduler';
export * from './backoff';
export * from './classify';
export * from './context';
export * from './history';
export * from './policy';
export * from './decision';
export * from './timeout';
export * from './metrics';
export * from './executor';
export * from './registry';
export * from './engine';
