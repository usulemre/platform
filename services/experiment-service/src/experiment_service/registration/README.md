# experiment-service · registration

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentRegistrationService: register-before-run with an immutable manifest and Trial-Ledger linkage.

## Responsibilities

Orchestrate registration before execution; bind the immutable manifest and Trial-Ledger linkage; hold no persistence.

## Relationships

Consumed by management; precedes configuration/execution.

## Dependencies

core_domain.shared (EntityId); model.

## Related Governance Documents

CLAUDE.md (SM-5, EX-1/3, FB-5); Architecture V2 §5.5; RB-01 · STAT; Experiment Tracking Governance; P2-01, P3-03.
