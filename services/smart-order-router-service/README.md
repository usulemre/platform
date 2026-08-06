# smart-order-router-service (Phase 7.8)

The canonical **Smart Order Router (SOR)** — the venue selection and order routing engine that
receives routing requests from the Execution Engine and determines the optimal execution venue
according to configurable routing policies. **This service implements REAL, deterministic routing
logic** (via the `@platform/sor-sdk` state machine + policy framework + venue ranking framework); it
is broker-independent.

## What it does

- **Routing engine** — the deterministic pipeline: discover candidate venues → filter by feasibility
  (capability / status / blacklist) → evaluate the routing policies → **rank** the feasible venues →
  select the route (with a fallback) → validate → confirm → execution ready (or routing failed).
- **Policy framework** — REAL deterministic evaluators for the 10 policy types (best available,
  lowest cost, lowest latency, highest liquidity, highest fill probability, preferred venue, manual
  override, failover, weighted, multi-venue placeholder).
- **Venue ranking framework** — (in the SDK) per-dimension scoring (cost, latency, liquidity, fill
  probability, preference) and the policy-driven composite ranking.
- **Lifecycle application** — state-machine-enforced transitions with an appended event, state entry
  and audit record on every step; the actions re-route / retry / fallback / blacklist / recover.
- **Venue registry** (venue catalog + blacklist), venue health/latency, **search / metrics / health /
  event-sourced replay**.

## What it is NOT

Broker-independent: no exchange SDK, no broker SDK, no FIX, no REST/WebSocket transport, no
connectivity, no persistence beyond in-memory v1 adapters. The venue is an abstraction; the confirmed
route is handed back to the Execution Engine (which routes downstream). Never communicates with a
venue.

## Layering

```
src/application (SmartOrderRouterService)
  → src/domain (routing · policy-evaluators · lifecycle · venues · search · metrics · health · replay)
  → @platform/sor-sdk (state machine + policy vocabulary + venue ranking + models + venue catalog)
  → src/infrastructure ports (RoutingStore · VenueStore · ExecutionEngine · Risk · Workflow · Audit · Notification · EventBus · Configuration)
```

`pnpm --filter @services/smart-order-router-service test` runs the unit + integration suite.
