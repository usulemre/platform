# dataset-service · services

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define the Data Platform service interfaces: DatasetService (register/validate/publish/deprecate/archive), DatasetCatalogService, DatasetOwnershipService.

## Responsibilities

Orchestrate the dataset lifecycle via deterministic gates; perform no adjudication, ingestion, storage, or persistence; hold no logic.

## Relationships

Top-level module: composes catalog, registry, lifecycle, validation_integration, versioning, events.

## Dependencies

core_domain.shared (EntityId); model; metadata.

## Related Governance Documents

CLAUDE.md (DI-1, DE-1, AI-1, CP-7); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
