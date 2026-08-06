# portfolio-service · exposure

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioExposure and ExposureManagementService: measured exposures governed against constraints.

## Responsibilities

Govern exposures against constraints; reference measured values (computed by the deterministic engine); hold no computation.

## Relationships

Consumed by diversification, reporting, specifications.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (PS-2, RS-1, DE-1); Architecture V2 §5.6; RB-12 · PORT; RB-13 · RISK.
