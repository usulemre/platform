# storage · metadata_storage

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define StorageMetadata and the MetadataStore interface: traceable, immutable storage metadata.

## Responsibilities

Represent storage metadata with provenance/lineage references for governance traceability; append-only; hold no persistence.

## Relationships

Consumed by every store for traceability; feeds the lineage graph / audit.

## Dependencies

platform_contracts.common (Id); core (StorageIdentifier, StorageKind); standard library.

## Related Governance Documents

CLAUDE.md (CP-6/7, DP-1/2); Architecture V2 §5.10; RB-06/07 · DATA; Dataset Governance.
