# storage · archive

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define ArchivePolicy and the ArchiveService interface: lifecycle tiering / archival.

## Responsibilities

Represent archival policy (when/where to tier) and expose archive/restore as an interface; preserve immutability/reproducibility; hold no infrastructure.

## Relationships

Works with retention and lifecycle; consumes StorageClass tiers.

## Dependencies

platform_contracts.common (Id); core (StorageClass); standard library.

## Related Governance Documents

CLAUDE.md (SC-2, RP-4, CP-2); Architecture V2 §5.10; RB-05 · REPRO; P5-01.
