# storage · core

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define StorageClass (tiers), StorageKind, StorageIdentifier, StorageProfile, StorageContext, and the StorageProviderPort interface.

## Responsibilities

Provide the canonical, vendor-neutral storage identity/profile/context, tiering classes, and the provider port; hold no database/object-store/client logic.

## Relationships

Consumed by every other Storage Layer module; implemented by concrete backends behind the port.

## Dependencies

platform_contracts.common (CorrelationId, SchemaVersion); standard library.

## Related Governance Documents

CLAUDE.md (AV2-12, CP-2, SC-2, SEC-4, PIT-1, NM-2); Architecture V2 §5.10, §6.4; RB-05 · REPRO; TDR §12/§13.
