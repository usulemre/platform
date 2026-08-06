# storage · errors

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define StorageError, StorageErrorKind, and StorageFrameworkError: the canonical, vendor-neutral storage error model.

## Responsibilities

Express storage errors in vendor-neutral terms (not-found/mutation-forbidden/retention/vintage/as-of/integrity/vendor-leak/irrecoverable); leak no vendor details; hold no logic.

## Relationships

Used across the Storage Layer modules.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (CP-2, RP-4, DI-3, PIT-1, SEC-4, AV2-12); Architecture V2 §5.10, §6.4; RB-05 · REPRO; RB-06/07 · DATA.
