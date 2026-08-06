# experiment-service · status

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentStatus: the current lifecycle state plus the supplied time it was entered.

## Responsibilities

Represent experiment status as an immutable value object; hold no logic.

## Relationships

Consumed by model and metadata.

## Dependencies

lifecycle (ExperimentLifecycle); standard library.

## Related Governance Documents

CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.5; RB-02 · RMET.
