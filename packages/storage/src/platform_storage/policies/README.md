# storage · policies

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define StoragePolicy (versioned) and the governance policy interfaces: ImmutabilityPolicy, ReproducibilityPolicy, TraceabilityPolicy, VendorIndependencePolicy.

## Responsibilities

Express the storage governance rules (immutability, reproducibility, traceability, vendor independence) as interfaces; hold no logic.

## Relationships

Enforced by deterministic components; consumed across the Storage Layer.

## Dependencies

platform_contracts.common (Id, SchemaVersion); standard library.

## Related Governance Documents

CLAUDE.md (CP-2/4/6/7, RP-1/4, AV2-12); Architecture V2 §5.10; RB-05 · REPRO.
