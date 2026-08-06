# dataset-service · application · lifecycle

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define DatasetLifecycleCoordinator: orchestrate registration/validation/publication/deprecation/archival, version promotion, and replacement.

## Responsibilities

Coordinate lifecycle transitions via deterministic gates (publication requires certification); fail-closed; hold no decision logic.

## Dependencies

core_domain.shared (EntityId); dataset_service.lifecycle (domain states/transitions).

## Relationships

Ties together registration, validation_coordination, and version_management.

## Related Governance Documents

CLAUDE.md (DI-1, CP-2, DE-1, RL-1); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
