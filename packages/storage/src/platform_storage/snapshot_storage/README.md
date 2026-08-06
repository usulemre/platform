# storage · snapshot_storage

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define StorageSnapshot and the SnapshotStore interface: immutable, time-travel snapshots.

## Responsibilities

Represent snapshots as immutable, content-addressed, time-stamped items enabling time-travel/recovery; append-only; hold no persistence.

## Relationships

Supports lifecycle recovery and reproducibility; consumed by backup/archive.

## Dependencies

platform_contracts.common (ContentHash); core (StorageIdentifier); standard library.

## Related Governance Documents

CLAUDE.md (CP-2, RP-1); Architecture V2 §5.10; RB-05 · REPRO.
