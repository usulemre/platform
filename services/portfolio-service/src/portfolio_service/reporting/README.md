# portfolio-service · reporting

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioReport and PortfolioReportingService: the immutable, explainable portfolio report and its generation.

## Responsibilities

Aggregate the summary, measured exposures, and breaches into an explainable report; compute no statistics/mathematics; hold no logic.

## Relationships

core_domain.shared (EntityId); model (PortfolioSummary); exposure (PortfolioExposure).

## Dependencies

Consumed by review/management/governance.

## Related Governance Documents

CLAUDE.md (EXP-2, CP-7, PS-4); Architecture V2 §5.6; RB-12 · PORT.
