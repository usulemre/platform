# @platform/sor-sdk (Phase 7.8)

The shared **Smart Order Router (SOR)** SDK — the single source of truth for the routing vocabulary,
the routing lifecycle state machine, the policy framework vocabulary and the **venue ranking
framework**. Consumed by the `smart-order-router-service` and its `trading-web` / `admin-web` UIs.

## What it defines

- **Statuses & state machine** (`lifecycle.ts`) — `execution request → venue discovery → venue
filtering → policy evaluation → venue ranking → route selection → route validation → route
confirmed → execution ready` (+ `routing failed`), the `ROUTING_TRANSITIONS` table, `canTransition`,
  `happyPathNext`, and the actions `re-route / fallback / retry / blacklist / recover`.
- **Policies** (`policies.ts`) — the 10 policy types (best available, lowest cost, lowest latency,
  highest liquidity, highest fill probability, preferred venue, manual override, failover, weighted,
  multi-venue placeholder), the routing strategies, the venue types (crypto/stock exchange, broker,
  dark-pool & internal-crossing placeholders) and status.
- **Ranking** (`ranking.ts`) — the deterministic venue ranking framework: per-dimension scoring
  (cost, latency, liquidity, fill probability, preference) and the policy-driven composite `rankVenues`.
- **Domain models & venue catalog** (`contracts.ts`) — Routing, RoutingRequest, RoutingDecision,
  RoutingPolicy, Venue, VenueScore, VenueHealth, VenueLatency, VenueCapability, RankedVenue,
  RoutingMetrics, RoutingAudit, RoutingHistory, plus the canonical `VENUES`.
- **Feasibility** (`identifiers.ts`) — venue feasibility (capability / status / blacklist).

## What it is NOT

No exchange SDK, no broker SDK, no FIX, no HTTP/WebSocket transport, no persistence, no connectivity.
The rules and ranking are **real** deterministic logic; the transitions and route selection are
applied by the SOR service, and execution happens downstream.
