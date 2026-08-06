# experiment-service · lifecycle

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentLifecycle (PROPOSED/REGISTERED/CONFIGURED/READY/RUNNING/VALIDATING/COMPLETED/APPROVED/ARCHIVED + SUSPENDED/CANCELLED), the canonical transitions (revision/suspension/cancellation), and the lifecycle-service interface.

## Responsibilities

Enumerate the lifecycle and its legal transitions as data; replay/branching create new lineage (RL-1); hold no logic.

## Relationships

Consumed by model, status, management, policies.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RL-1, EX-1, CP-5); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance.
