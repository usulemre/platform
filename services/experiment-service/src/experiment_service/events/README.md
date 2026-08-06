# experiment-service · events

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define the canonical experiment domain events: ExperimentRegistered, ExperimentConfigured, ExperimentStarted, ExperimentCompleted, ExperimentValidationRequested, ExperimentValidated, ExperimentApproved, ExperimentArchived.

## Responsibilities

Represent experiment lifecycle facts as immutable domain events; ExperimentValidated records a deterministic-engine outcome, it does not assert it.

## Relationships

core_domain.shared (DomainEvent, EntityId); align with core_domain.experiment events.

## Dependencies

Published to the bus/audit.

## Related Governance Documents

CLAUDE.md (CP-2/7, CP-5); Architecture V2 §5.5, §5.10; RB-02 · RMET; Experiment Tracking Governance.
