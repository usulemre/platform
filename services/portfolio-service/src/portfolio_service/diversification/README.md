# portfolio-service · diversification

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define DiversificationGovernanceService: govern a portfolio's diversification/concentration against constraints.

## Responsibilities

Govern diversification deterministically against constraints; reference measured values; compute no mathematics; hold no logic.

## Relationships

core_domain.shared (EntityId); consumes constraints/exposures; consumed by construction/specifications.

## Dependencies

CLAUDE.md (PS-2, DE-1); Architecture V2 §5.6; RB-12 · PORT.

## Related Governance Documents

CLAUDE.md (PS-2, DE-1); Architecture V2 §5.6; RB-12 · PORT.
