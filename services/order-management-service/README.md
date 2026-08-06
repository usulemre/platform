# order-management-service (Phase 7.6)

The canonical **Order Management System (OMS)** — the single source of truth for all orders before
they are routed to execution venues. **This service implements REAL, deterministic order lifecycle
logic** (via the `@platform/order-sdk` state machine); it is not a mock.

## What it does

- **Order factory & validation** — build an order from a request and run REAL pre-trade validation
  (quantity, required prices per type, iceberg display size, algorithmic placeholders).
- **Lifecycle application** — apply state-machine-enforced transitions (`created → validated →
pending approval → approved → queued → submitted → accepted → partially filled → filled /
cancelled / rejected / expired`) with an appended event, state-history entry and audit record on
  every step. Illegal transitions are refused.
- **Actions** — replace / amend / suspend / resume / cancel / retry, gated by `permittedActions`.
- **Fill bookkeeping** — filled/remaining quantity and average execution price from the order's own
  fills (standard OMS arithmetic; not market data or PnL).
- **Search / metrics / health** — the blotter query, status aggregation, and deterministic health
  checks (reject rate, suspended, unrouted-working, fill integrity).
- **Replay** — event-sourced reconstruction of the status timeline, validated against the state
  machine and the recorded status.
- **Views** — active / working / completed / filled / rejected / cancelled orders, timeline, audit,
  history.

## What it is NOT

No broker SDK, no exchange API, no FIX, no HTTP/WebSocket transport, no order execution, no
persistence beyond in-memory v1 adapters. Routing to an execution venue is an abstraction recorded on
the order (`OrderRoute`) and dispatched through the Execution Gateway port; the actual venue
interaction happens downstream (Execution Simulator / Live Trading Platform).

## Layering

```
src/application (OrderManagementService)
  → src/domain (lifecycle · validation · search · metrics · health · replay)
  → @platform/order-sdk (the order state machine + models)
  → src/infrastructure ports (OrderStore · ExecutionGateway · Risk · Workflow · Audit · Notification · EventBus · Configuration)
```

`pnpm --filter @services/order-management-service test` runs the unit + integration suite.
