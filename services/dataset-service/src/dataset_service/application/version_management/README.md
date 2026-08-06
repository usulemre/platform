# dataset-service · application · version_management

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define DatasetVersionManagementService: version creation, version promotion, and governed dataset replacement.

## Responsibilities

Orchestrate immutable versioning; promotion re-validates; replacement supersedes-and-deprecates (never mutates); preserve history; hold no logic.

## Dependencies

core_domain.shared (EntityId); dataset_service.model, dataset_service.versioning (domain).

## Relationships

Coordinates with validation_coordination (new versions revalidate) and lifecycle.

## Related Governance Documents

CLAUDE.md (CP-2, VER-1/2, RP-4, DEPR-1..3); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
