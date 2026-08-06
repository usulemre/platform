# storage · lifecycle

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define StorageLifecycle (REGISTERED/INITIALIZED/AVAILABLE/ACTIVE/ARCHIVED/RETIRED), the canonical transitions, StorageVersion, StorageStatus, and the lifecycle service (versioning/snapshots/archival/recovery/migration).

## Responsibilities

Enumerate the storage lifecycle and legal transitions as data and expose the lifecycle operations as an interface; a change creates a new immutable version; hold no infrastructure.

## Relationships

Consumed by artifact/dataset/snapshot storage, archive, retention.

## Dependencies

platform_contracts.common (ContentHash, Id, SchemaVersion); standard library.

## Related Governance Documents

CLAUDE.md (CP-2, RP-4, SC-2, RL-1); Architecture V2 §5.10; RB-05 · REPRO; P5-01.
