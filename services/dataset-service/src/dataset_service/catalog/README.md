# dataset-service · catalog

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define CatalogEntry and the DatasetCatalog interface: the authoritative catalog over registered datasets.

## Responsibilities

Expose an immutable, queryable catalog of datasets by identity and classification; hold no storage.

## Relationships

Consumed by discovery and services; backed by the registry.

## Dependencies

metadata; model.

## Related Governance Documents

CLAUDE.md (DP-1, CP-7); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
