# experiment-service · execution_coordination

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentExecutionCoordinator: prepare runs, enroll trials in the Trial Ledger before they run, and record completion.

## Responsibilities

Delegate execution to the deterministic Backtesting/Quant engines; count every trial before it runs; never execute backtests/statistics; hold no logic.

## Relationships

core_domain.shared (EntityId); delegates to the Backtesting engine (by reference); uses the Trial Ledger.

## Dependencies

Consumed by management; precedes validation_coordination.

## Related Governance Documents

CLAUDE.md (EX-4, SM-5, AD-3, DE-1); Architecture V2 §5.5, §5.6, §6.3; RB-11 · BT; RB-01 · STAT; P2-01/07.
