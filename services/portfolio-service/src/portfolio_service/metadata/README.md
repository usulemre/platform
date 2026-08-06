# portfolio-service · metadata

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioMetadata: the immutable, auditable, provenance-bearing metadata of a portfolio.

## Responsibilities

Carry portfolio metadata (identity, description, owner, status, summary, provenance, tags) as data; hold no logic.

## Relationships

Consumed by management and repositories.

## Dependencies

core_domain.shared (Provenance); model; status.

## Related Governance Documents

CLAUDE.md (CP-7, PS-4); Architecture V2 §5.6; RB-12 · PORT.
