# dataset-service · model

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define the canonical Data Platform models: Dataset, DatasetVersion, DatasetIdentifier, DatasetStatus, DatasetClassification, DatasetOwnership, and the classification enums.

## Responsibilities

Represent the platform (catalog) view of a dataset as immutable, versioned, provenance-bearing data; reference the certified domain aggregate by identity; hold no logic.

## Relationships

Consumed by every other Data Platform module.

## Dependencies

core_domain.shared (AggregateRoot, ContentAddress, Provenance, Version); lifecycle.

## Related Governance Documents

CLAUDE.md (DI-1, DP-1/3, PIT-1/2, CP-2/7, SEC-2, NM-2); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance; P1-01.
