# dataset-service · application · access_management

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

## Purpose

Define DatasetAccessManagementService: grant/revoke/check dataset access, default-deny and need-to-know.

## Responsibilities

Coordinate deterministic, least-privilege access; hold no logic (enforcement is deterministic, never AI).

## Dependencies

core_domain.shared (EntityId); dataset_service.access_control (domain).

## Relationships

Consumes the Data Platform access-control policy; used by discovery/search.

## Related Governance Documents

CLAUDE.md (SEC-2/3, AV2-25); Architecture V2 §5.8, §6.5; RB-27 · SEC; Dataset Governance.
