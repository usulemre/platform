# portfolio-service · repositories

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define the Portfolio Engine repository interfaces: PortfolioRepositoryContract (append-only snapshots), PortfolioCandidateRepository.

## Responsibilities

Express append-only, immutable retrieval of portfolio snapshots and candidates as interfaces; hold no persistence.

## Relationships

Consumed by management; complements core_domain.portfolio repositories and the Portfolio Registry.

## Dependencies

core_domain.shared (EntityId); model.

## Related Governance Documents

CLAUDE.md (PS-4, CP-2, RL-2); Architecture V2 §5.6; RB-12 · PORT; Portfolio Registry.
