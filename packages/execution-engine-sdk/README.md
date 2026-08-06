# @platform/execution-engine-sdk (Phase 7.7)

The shared **Execution Engine** SDK — the single source of truth for the execution vocabulary, the
lifecycle state machine and the policy framework vocabulary. Consumed by the
`execution-engine-service` and its `trading-web` / `admin-web` UIs.

## What it defines

- **Statuses & state machine** (`lifecycle.ts`) — the 9 statuses (`order received → execution
planned → execution validated → waiting for venue → executing → partially executed → completed /
cancelled / failed`), the `EXECUTION_TRANSITIONS` table, `canTransition`, `happyPathNext`,
  terminal/working/retryable predicates.
- **Actions** — `retry / pause / resume / cancel / replay` with `permittedActions` / `canApplyAction`.
- **Policies** (`policies.ts`) — the 10 policy types (immediate, scheduled, time-window, partial,
  retry, timeout, priority, throttling, venue selection, risk validation) with parameter schemas, the
  `PolicyEvaluation` result shape, and the venue abstractions (simulator / paper / live).
- **Domain models** (`contracts.ts`) — Execution, ExecutionRequest, ExecutionPlan, ExecutionTask,
  ExecutionSession, ExecutionPolicy, ExecutionResult, ExecutionState, ExecutionEvent,
  ExecutionTimeline, ExecutionMetrics, ExecutionMetadata, ExecutionAudit.
- **Primitives** (`identifiers.ts`) — execution bookkeeping (executed/remaining quantity, average
  execution price, progress, slice splitting).

## What it is NOT

No broker SDK, no exchange API, no FIX, no HTTP/WebSocket transport, no persistence, no routing
implementation. The transition table, action predicates and policy vocabulary are **real**
deterministic rules; the transitions and policy evaluation are applied by the Execution Engine
service, and routing to a venue happens downstream.
