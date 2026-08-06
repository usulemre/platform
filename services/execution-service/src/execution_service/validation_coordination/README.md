# execution-service · validation_coordination

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionValidationCoordinator: orchestrate structural validation (Validation Foundation) and research-to-production parity (parity harness).

## Responsibilities

Coordinate validation and parity; a parity breach blocks authorization; assert no significance; hold no logic.

## Relationships

core_domain.execution (ParityReport); core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport).

## Dependencies

Uses the Validation Foundation for orchestration; gates the transition to AUTHORIZED.

## Related Governance Documents

CLAUDE.md (AI-2, DE-1, P3-15); Architecture V2 §5.9, §6.3, §7.2; RB-04 · VAL; RB-14 · EXEC; P3-15.
