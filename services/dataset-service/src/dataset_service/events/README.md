# dataset-service · events

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define the canonical dataset domain events: DatasetRegistered, DatasetValidated, DatasetPublished, DatasetDeprecated, DatasetArchived, DatasetVersionCreated, DatasetSchemaUpdated, DatasetOwnershipTransferred.

## Responsibilities

Represent dataset lifecycle facts as immutable domain events carrying the domain event envelope; records, not commands.

## Relationships

Published to the bus/audit; align with core_domain.dataset events.

## Dependencies

core_domain.shared (DomainEvent, EntityId).

## Related Governance Documents

CLAUDE.md (CP-2/7); Architecture V2 §5.8, §5.10; Dataset Governance.
