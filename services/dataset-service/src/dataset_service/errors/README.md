# dataset-service · errors

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define the Data Platform errors: DatasetNotRegistered, NonAsOfDatasetRead, ImmutableVersionMutation, UncertifiedDatasetPublished, SurvivorshipUnsafe, LineageDefect, DatasetAccessDenied, IllegalDatasetTransition.

## Responsibilities

Express violated data invariants (register-before-use, as-of, immutability, certification, survivorship, lineage, access, lifecycle) as errors.

## Relationships

Used across the Data Platform modules.

## Dependencies

core_domain.shared (DomainError).

## Related Governance Documents

CLAUDE.md (DP-1, PIT-1, CP-2/6, DI-1, FB-7, SEC-2); Architecture V2 §5.8; RB-06/07 · DATA; RB-08 · PIT.
