# dataset-service · schema

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define DatasetSchema, SchemaField, FieldType, SchemaEvolution, and SchemaEvolutionKind: the declarative schema and governed evolution model.

## Responsibilities

Describe dataset shape and schema evolution as immutable, versioned data; historical schemas remain interpretable; hold no logic.

## Relationships

Consumed by versioning, metadata, validation_integration.

## Dependencies

platform_contracts.common (SchemaVersion); standard library.

## Related Governance Documents

CLAUDE.md (VER-1/2, CP-2, DP-1); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
