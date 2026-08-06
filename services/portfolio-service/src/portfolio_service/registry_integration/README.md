# portfolio-service · registry_integration

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioRegistryPort: the integration port to the Portfolio Registry.

## Responsibilities

Integrate immutable, versioned, rationale-bearing snapshot registration as an interface; hold no persistence.

## Relationships

Consumed by management; delegates to core_domain.portfolio repositories and the Portfolio Registry.

## Dependencies

core_domain.shared (EntityId); model.

## Related Governance Documents

CLAUDE.md (PS-4, CP-2/7); Architecture V2 §5.6; RB-12 · PORT; Portfolio Registry.
