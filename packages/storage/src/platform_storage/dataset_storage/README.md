# storage · dataset_storage

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define the DatasetStore interface: bitemporal, as-of, vintage-aware dataset storage.

## Responsibilities

Provide the canonical dataset-store interface (as-of reads only, append-only vintages, never overwrite); hold no database or persistence.

## Relationships

Backs the Data Platform As-Of Gateway / vintage store; realized by ArcticDB/lakehouse (out of scope).

## Dependencies

platform_contracts.common (ContentHash); core (StorageIdentifier); object_storage (ObjectRef); standard library.

## Related Governance Documents

CLAUDE.md (PIT-1, DI-3, CP-2); Architecture V2 §5.8, §5.10, §6.4; RB-08 · PIT; RB-06/07 · DATA; P1-01.
