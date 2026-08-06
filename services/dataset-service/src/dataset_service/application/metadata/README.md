# dataset-service · application · metadata

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define DatasetMetadataService: read and governed update of dataset catalog metadata.

## Responsibilities

Serve and version dataset metadata (updates create a new version); hold no persistence.

## Dependencies

core_domain.shared (EntityId); dataset_service.metadata (domain).

## Relationships

Consumes the Data Platform metadata/catalog.

## Related Governance Documents

CLAUDE.md (CP-2/7, DP-3); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
