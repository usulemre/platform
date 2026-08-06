# backtesting-service · validation_coordination

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define BacktestValidationCoordinator: orchestrate structural validation (Validation Foundation) and route to the deterministic Validation engine.

## Responsibilities

Coordinate validation; defer deflation/PBO/holdout/replication and promotion to the deterministic engine; assert no significance; hold no logic.

## Relationships

core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport).

## Dependencies

Uses the Validation Foundation for orchestration; gates the transition to COMPLETED.

## Related Governance Documents

CLAUDE.md (AI-2, DE-1, SI-3, VS-1..4); Architecture V2 §5.6, §6.3; RB-04 · VAL; RB-01 · STAT; P2-05..09.
