# smart-order-router module (trading-web · Phase 7.8)

The trader-facing UI for the **Smart Order Router**. Its data layer runs on inert mock routings built
via the real `@platform/sor-sdk` lifecycle state machine + policy framework + venue ranking framework
(routings are constructed by walking legal status paths, so their timelines replay consistently). No
venue is contacted; no exchange/broker/FIX.

## Layering

```
components (Client Components)
  → hooks (TanStack Query + a route-preview mutation)
  → application (SorAdminService: routing → view-model + aggregate views + route preview)
  → data (repository · Mock adapter · seed built by walking legal lifecycle paths · UI-local routing preview)
  → domain (query · derive[metrics/health/replay] · mappers) → @platform/sor-sdk (state machine + policies + ranking + models + venues)
```

## Surfaces (`/smart-order-router`, `/smart-order-router/*`)

Dashboard · Venue Explorer · Venue Health · Routing Policies · Routing Rules · Routing Decisions ·
Routing Timeline · Routing Metrics · Routing History · Routing Replay · Routing Audit · Routing detail.

## What it is (and is not)

- **Is:** presentation of routing lifecycle state, the venue ranking and a deterministic route preview.
- **Is not:** no lifecycle/ranking logic of its own (that is the SDK/service), no persistence, no
  exchange/broker/FIX, no connectivity. Read-only.
