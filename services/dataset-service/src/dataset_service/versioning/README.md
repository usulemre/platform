# dataset-service · versioning

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define VersioningPolicy and DatasetVersioningService: version-upgrade and governed schema-evolution interfaces.

## Responsibilities

Express immutable versioning and compatible schema evolution as interfaces; a new version revalidates and history is preserved; hold no logic.

## Relationships

Consumed by services; relates to lifecycle (version upgrade re-enters VALIDATING).

## Dependencies

model (DatasetVersion, DatasetIdentifier); schema; standard library.

## Related Governance Documents

CLAUDE.md (CP-2, VER-1/2, RP-4); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
