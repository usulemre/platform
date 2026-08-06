# storage · providers

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define StorageProvider, StorageCapabilities, and StorageProviderRegistry: the canonical, vendor-neutral storage backend model and its registry.

## Responsibilities

Represent storage backends and their capabilities in vendor-neutral terms; register-before-use; expose no vendor implementation details; hold no logic.

## Relationships

Consumed by lifecycle migration and platform services selecting a backend.

## Dependencies

platform_contracts.common (Id); core (StorageKind); standard library.

## Related Governance Documents

CLAUDE.md (AV2-12, SE-3, CP-7); Architecture V2 §5.10; RB-05 · REPRO; TDR §12/§13.
