# storage · artifact_storage

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define StorageArtifact and the ArtifactStore interface: immutable, content-addressed, reproducible research artifacts.

## Responsibilities

Represent research artifacts as immutable, manifest-referenced, content-addressed items; append-only; never GC reproducibility-critical artifacts; hold no persistence.

## Relationships

Consumed by the deterministic engines (backtest/validation) and the reproducibility spine.

## Dependencies

platform_contracts.common (ContentHash); core (StorageIdentifier); standard library.

## Related Governance Documents

CLAUDE.md (CP-2/4, RP-1/4, P1-02); Architecture V2 §5.10; RB-05 · REPRO; P5-01.
