# dataset-service · metadata

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define DatasetMetadata: the immutable, auditable, provenance-bearing catalog metadata of a dataset.

## Responsibilities

Carry dataset metadata (identity, description, classification, ownership, status, provenance, tags) as data; hold no logic.

## Relationships

Consumed by catalog, discovery, registry.

## Dependencies

core_domain.shared (Provenance); model.

## Related Governance Documents

CLAUDE.md (DP-1/3, CP-7); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
