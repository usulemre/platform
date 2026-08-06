# experiment-service · policies

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define the deterministic experiment policy interfaces: ExperimentPolicy, RegisterBeforeRunPolicy, ManifestImmutabilityPolicy, TrialCountingPolicy, ReproducibilityPolicy, IsolationBarrierPolicy.

## Responsibilities

Express the scientific-integrity rules (register-before-run, manifest immutability, trial counting, reproducibility, isolation barrier) as interfaces; hold no logic.

## Relationships

Enforced by deterministic engines; consumed by management.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (SM-5, EX-1/3/4, RP-2, AD-3, DE-1); Architecture V2 §5.5, §6.1; RB-01 · STAT; RB-02 · RMET; P2-01/07.
