/**
 * @platform/sor-sdk — the shared Smart Order Router (SOR) SDK.
 *
 * The single source of truth for the SOR *vocabulary, lifecycle/policy rules and venue ranking*: the
 * routing lifecycle state machine (`execution request → venue discovery → venue filtering → policy
 * evaluation → venue ranking → route selection → route validation → route confirmed → execution
 * ready`, plus a `routing failed` terminal), the lifecycle actions (re-route / fallback / retry /
 * blacklist / recover), the 10 canonical **routing policy** types (best available, lowest cost,
 * lowest latency, highest liquidity, highest fill probability, preferred venue, manual override,
 * failover, weighted, multi-venue placeholder), the venue types (crypto/stock exchange, broker,
 * dark-pool & internal-crossing placeholders) and status, the canonical venue catalog, the **venue
 * ranking framework** (deterministic per-dimension scoring + composite ranking) and the canonical
 * domain models (RoutingRequest, RoutingDecision, RoutingPolicy, RoutingStrategy, Venue, VenueScore,
 * VenueHealth, VenueLatency, VenueCapability, VenueStatus, RoutingMetrics, RoutingAudit,
 * RoutingHistory, Routing).
 *
 * It contains NO exchange SDK, NO broker SDK, NO FIX, NO HTTP/WebSocket transport, NO persistence and
 * NO connectivity. The transition table, action predicates, policy vocabulary and ranking are REAL
 * deterministic rules; the transitions and route selection are applied by the SOR service, and the
 * execution happens downstream in the Execution Engine. Consumed by the smart-order-router service
 * and its trading-web / admin-web UIs.
 */
export * from './lifecycle';
export * from './policies';
export * from './contracts';
export * from './ranking';
export * from './identifiers';
