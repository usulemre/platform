# dataset-service · application · search

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define DatasetSearchQuery and DatasetSearchService: text/faceted, access-filtered search over dataset metadata.

## Responsibilities

Expose search over metadata that never exceeds the caller's clearance; hold no search-index engine.

## Dependencies

dataset_service.metadata, dataset_service.model (domain).

## Relationships

Complements discovery; the concrete search index plugs in behind this interface.

## Related Governance Documents

CLAUDE.md (SEC-2, DP-1); Architecture V2 §5.8, §6.5; Dataset Governance; TDR §12.
