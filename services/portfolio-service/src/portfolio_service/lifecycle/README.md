# portfolio-service · lifecycle

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioLifecycle (PROPOSED/CONSTRUCTING/VALIDATING/REVIEWED/APPROVED/READY_FOR_EXECUTION/ARCHIVED + REJECTED), the canonical transitions (rebalancing/reconstruction/revalidation/versioning/retirement), and the lifecycle-service interface.

## Responsibilities

Enumerate the lifecycle and legal transitions as data; APPROVED/READY require validation + risk review; rebalancing/versioning create new lineage (RL-1, PS-4); hold no logic.

## Relationships

Consumed by model, status, construction, rebalancing, approval, management, policies.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (PS-4, RS-1, RL-1/2, AI-1); Architecture V2 §5.6; RB-12 · PORT; Portfolio Registry.
