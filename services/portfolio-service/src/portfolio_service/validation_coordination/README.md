# portfolio-service · validation_coordination

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioValidationCoordinator: orchestrate structural validation (Validation Foundation) and route to the deterministic Validation/Risk engines.

## Responsibilities

Coordinate validation; defer constraint/risk validation to the deterministic engines; require independent risk review; assert no significance; hold no logic.

## Relationships

core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport).

## Dependencies

Uses the Validation Foundation for orchestration; gates the transition to REVIEWED/APPROVED.

## Related Governance Documents

CLAUDE.md (AI-2, DE-1, RS-1/2, VS-1); Architecture V2 §5.6, §5.7, §6.3; RB-04 · VAL; RB-12 · PORT; RB-13 · RISK.
