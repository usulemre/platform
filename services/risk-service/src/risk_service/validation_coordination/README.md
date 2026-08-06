# risk-service · validation_coordination

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskValidationCoordinator: orchestrate structural validation (Validation Foundation) and route model-risk validation to the deterministic engine.

## Responsibilities

Coordinate validation; defer significance to the deterministic engine; assert no significance; hold no logic.

## Relationships

core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport).

## Dependencies

Uses the Validation Foundation for orchestration; gates the transition to REVIEWED.

## Related Governance Documents

CLAUDE.md (AI-2, DE-1, VS-1); Architecture V2 §5.7, §5.6, §6.3; RB-04 · VAL; RB-13 · RISK.
