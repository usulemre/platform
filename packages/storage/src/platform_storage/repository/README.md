# storage · repository

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define the storage repository abstractions: ReadRepository, AppendOnlyRepository, ContentAddressedRepository, AsOfReadPort.

## Responsibilities

Provide canonical, generic storage repository ports at the storage boundary; immutable/append-only, content-addressed, and as-of read; hold no persistence.

## Relationships

Consumed by the storage-backed repositories; complements the domain repository patterns.

## Dependencies

platform_contracts.common (ContentHash, Id); standard library.

## Related Governance Documents

CLAUDE.md (CP-2, PIT-1, P1-02); Architecture V2 §5.10, §6.4; RB-05 · REPRO; RB-08 · PIT.
