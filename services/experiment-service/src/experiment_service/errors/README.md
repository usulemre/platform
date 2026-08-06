# experiment-service · errors

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define the Experiment Service errors: UnregisteredExperimentRun, ManifestMutation, TrialNotCounted, IrreproducibleExperiment, ExperimentSelfAdjudication, IsolationBarrierBreach, IllegalExperimentTransition, UndeclaredDependency.

## Responsibilities

Express violated experiment invariants (register-before-run, manifest immutability, trial counting, reproducibility, separation of powers, isolation barrier, lifecycle, declared dependencies) as errors.

## Relationships

Used across the Experiment Service modules.

## Dependencies

core_domain.shared (DomainError).

## Related Governance Documents

CLAUDE.md (SM-5, EX-1..4, RP-2, CP-5, AD-3, FB-5, SE-2); Architecture V2 §5.5, §6.1; RB-01 · STAT; RB-02 · RMET; P2-01/07.
