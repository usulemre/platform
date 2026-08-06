# dataset-service · registry

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define DatasetRecord and the DatasetRegistry interface: the append-only, register-before-use inventory of datasets.

## Responsibilities

Express register-before-use, immutable dataset existence/status as an interface; hold no persistence.

## Relationships

Consumed by catalog and services; parallels the six platform registries.

## Dependencies

core_domain.shared (EntityId); lifecycle; model.

## Related Governance Documents

CLAUDE.md (DP-1, CP-2/7); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
