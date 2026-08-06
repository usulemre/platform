# experiment-service · validation_coordination

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentValidationCoordinator: orchestrate structural validation (Validation Foundation) and route to the deterministic Validation engine/scientific gate.

## Responsibilities

Coordinate validation; defer significance/PBO/holdout/replication and promotion to the deterministic engine; assert no significance; hold no logic.

## Relationships

core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport).

## Dependencies

Uses the Validation Foundation for orchestration; gates the transition to COMPLETED/APPROVED.

## Related Governance Documents

CLAUDE.md (AI-2, DE-1, VS-1..4, RG-1); Architecture V2 §5.5, §5.6, §6.3; RB-04 · VAL; RB-01 · STAT; P2-05..09.
