# dataset-service · application · errors

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define the Dataset Service errors: RegistrationRejected, ValidationNotCleared, VersionPromotionBlocked, DatasetReplacementError, AccessCoordinationDenied, IllegalServiceTransition.

## Responsibilities

Express application-layer failures (registration, validation-clearance, promotion, replacement, access, lifecycle) as errors.

## Dependencies

core_domain.shared (DomainError).

## Relationships

Used across the application services; complements the Phase-2.0 domain errors.

## Related Governance Documents

CLAUDE.md (DP-1, DI-1, CP-2, SEC-2, DEPR-2); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
