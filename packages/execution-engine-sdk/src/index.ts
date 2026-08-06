/**
 * @platform/execution-engine-sdk — the shared Execution Engine SDK.
 *
 * The single source of truth for the Execution Engine *vocabulary and lifecycle/policy rules*: the 9
 * canonical execution statuses and the **execution lifecycle state machine** (`order received →
 * execution planned → execution validated → waiting for venue → executing → partially executed →
 * completed / cancelled / failed`), the lifecycle actions (retry / pause / resume / cancel / replay)
 * and their permission predicates, the lifecycle event types, the 10 canonical **execution policy**
 * types (immediate, scheduled, time-window, partial, retry, timeout, priority, throttling, venue
 * selection, risk validation) with their parameter schemas, the venue abstractions, the canonical
 * execution domain models (Execution, ExecutionRequest, ExecutionPlan, ExecutionTask,
 * ExecutionSession, ExecutionPolicy, ExecutionResult, ExecutionState, ExecutionEvent,
 * ExecutionTimeline, ExecutionMetrics, ExecutionMetadata, ExecutionAudit) and pure identifier /
 * execution-arithmetic primitives.
 *
 * It contains NO broker SDK, NO exchange API, NO FIX, NO HTTP/WebSocket transport, NO persistence and
 * NO execution routing implementation. The transition table, action predicates and policy vocabulary
 * are REAL deterministic rules; the transitions and policy evaluation are applied by the Execution
 * Engine service, and routing to a venue happens downstream (Execution Simulator / Live Trading
 * Platform). Consumed by the execution-engine service and its trading-web / admin-web UIs.
 */
export * from './lifecycle';
export * from './policies';
export * from './contracts';
export * from './identifiers';
