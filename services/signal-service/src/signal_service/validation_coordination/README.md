# signal-service · validation_coordination

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalValidationCoordinator: orchestrate structural validation (Validation Foundation) and route to the deterministic Validation engine.

## Responsibilities

Coordinate validation; defer significance and promotion to the deterministic engine; assert no significance; hold no logic.

## Relationships

core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport).

## Dependencies

Uses the Validation Foundation for orchestration; gates the transition to APPROVED.

## Related Governance Documents

CLAUDE.md (AI-2, DE-1, VS-1); Architecture V2 §5.5, §5.6, §6.3; RB-04 · VAL; RB-09/10 · FAR.
