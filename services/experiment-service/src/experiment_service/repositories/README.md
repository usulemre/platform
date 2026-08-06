# experiment-service · repositories

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define the Experiment Service repository interfaces: ExperimentRepositoryContract (append-only), ExperimentDependencyRepository.

## Responsibilities

Express append-only, immutable retrieval of experiments and their dependencies as interfaces; backward transitions create new lineage; hold no persistence.

## Relationships

Consumed by management; complements core_domain.experiment repositories and the Trial Ledger.

## Dependencies

core_domain.shared (EntityId); model; dependencies.

## Related Governance Documents

CLAUDE.md (CP-2, EX-3, RL-1, SM-5); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance; P2-01.
