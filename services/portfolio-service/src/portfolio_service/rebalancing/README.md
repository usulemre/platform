# portfolio-service · rebalancing

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define RebalancingCoordinator: coordinate governed rebalancing/reconstruction producing a new versioned candidate.

## Responsibilities

Coordinate rebalancing that re-validates and preserves the approved snapshot (RL-1); net-of-cost, turnover-aware; hold no mathematics.

## Relationships

core_domain.shared (EntityId); produces a new candidate via construction/optimization.

## Dependencies

Consumed by management.

## Related Governance Documents

CLAUDE.md (PS-2/4, RL-1, RP-1); Architecture V2 §5.6; RB-12 · PORT; P1-08.
