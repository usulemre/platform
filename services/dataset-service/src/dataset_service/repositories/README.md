# dataset-service · repositories

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define the Data Platform repository interfaces: DatasetRepositoryContract, DatasetVersionRepository, LineageRepository.

## Responsibilities

Express append-only, immutable retrieval of datasets, versions, and lineage as interfaces; hold no persistence; the PIT read path is the As-Of Gateway.

## Relationships

Consumed by services; complements core_domain.dataset.DatasetRepository/AsOfGateway.

## Dependencies

core_domain.shared (EntityId); model; lineage.

## Related Governance Documents

CLAUDE.md (CP-2, PIT-1, DP-1); Architecture V2 §5.8, §6.4; RB-08 · PIT; P1-01.
