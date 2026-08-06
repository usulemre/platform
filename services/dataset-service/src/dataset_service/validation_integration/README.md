# dataset-service · validation_integration

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define DatasetStructuralValidation (bridge to the Validation Foundation) and DatasetCertificationGate (bridge to the deterministic certification engine).

## Responsibilities

Integrate structural validation and defer data-quality certification to the deterministic engine; assert no statistical significance; hold no logic.

## Relationships

Consumes platform_validation and (conceptually) core_domain.dataset.CertificationService; used by services.

## Dependencies

platform_validation (ValidationContext, ValidationReport); core_domain.shared (EntityId).

## Related Governance Documents

CLAUDE.md (DI-1, AI-2, DE-1, VS-2); Architecture V2 §5.8, §5.6; RB-06/07 · DATA; RB-04 · VAL; P2-03.
