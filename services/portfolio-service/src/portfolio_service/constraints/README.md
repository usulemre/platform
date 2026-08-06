# portfolio-service · constraints

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioConstraint, ConstraintKind, ConstraintSeverity, and ConstraintManagementService: deterministic investment/risk constraints (incl. mandatory risk constraints) and their management.

## Responsibilities

Represent constraints as immutable data with a management interface; include mandatory risk constraints from the Risk Engine; hold no allocation mathematics.

## Relationships

Consumed by construction, diversification, exposure, specifications; risk constraints reference the Risk Engine by identity.

## Dependencies

core_domain.shared (EntityId, Ref); standard library.

## Related Governance Documents

CLAUDE.md (PS-2, RS-1, DE-1); Architecture V2 §5.6, §5.7; RB-12 · PORT; RB-13 · RISK; P1-08.
