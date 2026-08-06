# dataset-service · application · registration

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define DatasetRegistrationService and DatasetRegistrationWorkflow: the register-before-use application service and its orchestration workflow.

## Responsibilities

Orchestrate dataset registration and hand off to validation via deterministic gates; hold no persistence or decision logic.

## Dependencies

core_domain.shared (EntityId); dataset_service.model, dataset_service.registry (domain).

## Relationships

Consumes the Data Platform registry; precedes validation_coordination.

## Related Governance Documents

CLAUDE.md (DP-1, DE-1, CP-7); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
