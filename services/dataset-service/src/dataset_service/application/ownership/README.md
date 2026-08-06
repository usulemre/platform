# dataset-service · application · ownership

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define DatasetOwnershipService: transfer dataset ownership with recorded accountability.

## Responsibilities

Coordinate ownership transfer as a recorded, interface-only operation; hold no logic.

## Dependencies

core_domain.shared (EntityId); dataset_service.model (DatasetOwnership, domain).

## Relationships

Emits DatasetOwnershipTransferred (domain) via the lifecycle/events.

## Related Governance Documents

CLAUDE.md (CP-7, HO-1); Architecture V2 §5.8; Dataset Governance.
