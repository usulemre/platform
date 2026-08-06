# orders module (trading-web · Phase 7.6)

The researcher/trader-facing UI for the **Order Management System**. Its data layer runs on inert
mock orders built via the real `@platform/order-sdk` lifecycle state machine (orders are constructed
by walking legal status paths, so their timelines replay consistently). No order is executed; no
broker/exchange/FIX.

## Layering

```
components (Client Components)
  → hooks (TanStack Query)
  → application (OrdersAdminService: order → view-model + aggregate views)
  → data (repository interface · Mock adapter · seed built by walking legal lifecycle paths)
  → domain (query · derive[metrics/health/replay] · mappers) → @platform/order-sdk (the state machine + models)
```

## Surfaces

Dashboard · Blotter · Active · Completed · Rejected · Cancelled · Search · Timeline · Audit · Replay
· Metrics · Health · Order detail.

## What it is (and is not)

- **Is:** presentation of order lifecycle state; formatting only in the mappers.
- **Is not:** no lifecycle logic of its own (that is the SDK/service), no persistence, no
  broker/exchange/FIX, no execution. Read-only.
