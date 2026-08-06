# portfolio-service · allocation

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioPosition, PortfolioAllocation, and AllocationManagementService: the allocation model and its management (reusing core Weight).

## Responsibilities

Represent positions/allocations as immutable data produced by the deterministic optimizer; reference only eligible signals; hold no allocation mathematics and no AI decision.

## Relationships

Consumed by construction, exposure, reporting; positions reference eligible signals by identity.

## Dependencies

core_domain.portfolio (Weight); core_domain.shared (EntityId, Ref); standard library.

## Related Governance Documents

CLAUDE.md (PS-1/2/3, AI-1, DE-1); Architecture V2 §5.6, §6.3; RB-12 · PORT; P1-08.
