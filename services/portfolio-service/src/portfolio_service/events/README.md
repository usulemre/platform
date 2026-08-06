# portfolio-service · events

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define the canonical portfolio domain events: PortfolioCreated, PortfolioConstructed, PortfolioValidated, PortfolioApproved, PortfolioRejected, PortfolioRebalanced, PortfolioArchived, PortfolioConstraintViolated, PortfolioRegistryUpdated.

## Responsibilities

Represent portfolio lifecycle facts as immutable domain events; PortfolioValidated records a deterministic-engine outcome.

## Relationships

core_domain.shared (DomainEvent, EntityId); align with core_domain.portfolio events.

## Dependencies

Published to the bus/audit.

## Related Governance Documents

CLAUDE.md (CP-2/7, PS-4); Architecture V2 §5.6, §5.10; RB-12 · PORT; Portfolio Registry.
