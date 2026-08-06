# dataset-service · application · validation_coordination

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define DatasetValidationCoordinator: orchestrates structural validation (Validation Foundation) and the deterministic certification gate before validation/publication.

## Responsibilities

Coordinate validation; defer certification/leakage/survivorship to the deterministic engine; assert no statistical significance; hold no logic.

## Dependencies

core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport); dataset_service.validation_integration (domain gate).

## Relationships

Uses the Validation Foundation for orchestration; gates the lifecycle transition to VALIDATED.

## Related Governance Documents

CLAUDE.md (DI-1, AI-2, DE-1, VS-2); Architecture V2 §5.8, §5.6; RB-06/07 · DATA; RB-04 · VAL; P2-03.
