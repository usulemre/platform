# dataset-service · lifecycle

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define DatasetLifecycle (PROPOSED/REGISTERED/VALIDATING/VALIDATED/PUBLISHED/DEPRECATED/ARCHIVED), the canonical transitions (incl. version-upgrade revalidation), and the lifecycle-service interface.

## Responsibilities

Enumerate the lifecycle and its legal transitions as data; publication requires a passed certification gate; hold no logic.

## Relationships

Consumed by model, registry, policies, services.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (DI-1, CP-2, RL-1); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
