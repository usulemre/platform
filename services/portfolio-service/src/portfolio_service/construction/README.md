# portfolio-service · construction

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioConstructionContext and PortfolioConstructionService: the reproducible construction context and coordination interface.

## Responsibilities

Coordinate deterministic construction from capital-eligible signals via the optimizer; be reproducible (manifest); never re-adjudicate signals or decide allocation with AI; hold no mathematics.

## Relationships

core_domain.shared (EntityId, Ref, RunManifestRef); consumes eligible signals; delegates to optimization.

## Dependencies

Consumed by management; precedes validation.

## Related Governance Documents

CLAUDE.md (PS-1/2/3, RP-1, PIT-1, AI-1, DE-1); Architecture V2 §5.6, §6.3; RB-12 · PORT; P1-08.
