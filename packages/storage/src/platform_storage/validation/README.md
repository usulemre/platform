# storage · validation

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define StorageIntegrityResult and the StorageValidator interface: content-hash integrity and reproducibility verification.

## Responsibilities

Verify stored-item integrity (content-hash match) and reproducibility from manifest; structural only, not statistical; hold no logic.

## Relationships

Consumed by artifact/dataset storage and the reproducibility spine.

## Dependencies

core (StorageIdentifier); standard library.

## Related Governance Documents

CLAUDE.md (CP-2/4, RP-1, SEC-4, AI-2); Architecture V2 §5.10; RB-05 · REPRO.
