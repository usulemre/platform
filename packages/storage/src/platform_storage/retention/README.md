# storage · retention

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define RetentionPolicy and the RetentionEnforcement interface: retention and tiering, with reproducibility-critical data never GC'd.

## Responsibilities

Represent retention policy (indefinite for reproducibility-critical) and enforce it deterministically; drive tiering; never delete reproducibility-critical data; hold no logic.

## Relationships

Consumed by archive and lifecycle; enforced deterministically.

## Dependencies

platform_contracts.common (Id); standard library.

## Related Governance Documents

CLAUDE.md (RP-4, SC-2, CP-4, AP-8); Architecture V2 §5.10; RB-05 · REPRO; P5-01.
