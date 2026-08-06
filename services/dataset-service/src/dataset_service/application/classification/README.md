# dataset-service · application · classification

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define DatasetClassificationService: assign/update dataset classification.

## Responsibilities

Set classification that drives access control; hold no logic.

## Dependencies

core_domain.shared (EntityId); dataset_service.model (domain).

## Relationships

Feeds access_management and discovery/search filters.

## Related Governance Documents

CLAUDE.md (SEC-2, CP-8); Architecture V2 §5.8; Dataset Governance.
