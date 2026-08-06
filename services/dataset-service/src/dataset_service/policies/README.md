# dataset-service · policies

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define the deterministic dataset policy interfaces: DatasetPolicy, RetentionPolicy, ImmutabilityPolicy, PointInTimePolicy.

## Responsibilities

Express the platform rules (retention of reproducibility-critical data, published-version immutability, as-of + survivorship safety) as interfaces; hold no logic.

## Relationships

Consumed by lifecycle and services; enforced deterministically.

## Dependencies

core_domain.shared (EntityId); lifecycle.

## Related Governance Documents

CLAUDE.md (RP-4, CP-2, PIT-1/2, SC-2); Architecture V2 §5.8; RB-08 · PIT; Dataset Governance; P5-01.
