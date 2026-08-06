# dataset-service · application · discovery

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define DatasetDiscoveryService: access-filtered catalog discovery on top of the Data Platform.

## Responsibilities

Expose catalog discovery that respects access control; hold no storage.

## Dependencies

dataset_service.discovery (domain query/result).

## Relationships

Consumes the Data Platform catalog; complements search.

## Related Governance Documents

CLAUDE.md (SEC-2, DP-1); Architecture V2 §5.8, §6.5; Dataset Governance.
