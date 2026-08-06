# @platform/order-sdk (Phase 7.6)

The shared **Order Management System (OMS)** SDK — the single source of truth for the OMS vocabulary
and the **order lifecycle state machine**. Consumed by the `order-management-service` and its
`trading-web` / `admin-web` UIs.

## What it defines

- **Statuses & state machine** (`lifecycle.ts`) — the 12 canonical statuses (`created → validated →
pending approval → approved → queued → submitted → accepted → partially filled → filled /
cancelled / rejected / expired`), the `ORDER_TRANSITIONS` table, `canTransition`, `nextStatuses`,
  `happyPathNext`, terminal/working/retryable predicates.
- **Actions** — `replace / amend / suspend / resume / cancel / retry` with `canApplyAction` /
  `permittedActions` predicates (deterministic, status + suspension aware).
- **Events** — the lifecycle event types recorded on an order's timeline.
- **Order types** (`order-types.ts`) — market, limit, stop, stop-limit, trailing-stop, iceberg, and
  the TWAP/VWAP **placeholders**; side and time-in-force, with per-type parameter requirements.
- **Domain models** (`contracts.ts`) — Order, OrderRequest, OrderExecution, OrderFill, OrderState,
  OrderEvent, OrderAudit, OrderHistory, OrderMetadata, OrderRoute, OrderApproval, OrderValidation.
- **Primitives** (`identifiers.ts`) — client order ids and order bookkeeping (filled / remaining
  quantity, average execution price, fill ratio).

## What it is NOT

No broker SDK, no exchange API, no FIX, no HTTP/WebSocket transport, no persistence, no routing
implementation. The transition table and action predicates are **real** deterministic rules; the
transitions themselves are applied by the Order Management Service, and routing to an execution venue
happens downstream.
