# storage · object_storage

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define ObjectRef and the ObjectStore interface: content-addressed, vendor-neutral object storage.

## Responsibilities

Provide the canonical object-store interface (content-addressed, immutable, WORM-capable); hold no object-store client, bytes, or persistence.

## Relationships

Consumed by dataset/artifact/snapshot storage; realized by an S3-compatible adapter (out of scope).

## Dependencies

platform_contracts.common (ContentHash); standard library.

## Related Governance Documents

CLAUDE.md (CP-2, SEC-4, P1-02, AV2-12); Architecture V2 §5.10, §6.4; RB-05 · REPRO; TDR §13.
