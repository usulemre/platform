# dataset-service · application · events

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define the Dataset Service events: DatasetRegistrationRequested, DatasetRegistered, DatasetValidationRequested, DatasetValidated, DatasetPublished, DatasetVersionPromoted, DatasetDeprecated, DatasetArchived.

## Responsibilities

Represent application/workflow signals as immutable events (incl. \*Requested command-signals); DatasetValidated records a deterministic-engine outcome.

## Dependencies

core_domain.shared (DomainEvent, EntityId).

## Relationships

Application-level; distinct from and complementary to the Phase-2.0 domain events.

## Related Governance Documents

CLAUDE.md (CP-2/7, DI-1); Architecture V2 §5.8, §5.10; Dataset Governance.
