# experiment-service · dependencies

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentDependency, DependencyKind, and ExperimentDependencyService: declared links from an experiment to research, datasets, features, validation, backtests, and prior experiments.

## Responsibilities

Represent cross-context dependencies by identity only; declare all dependencies explicitly; never create an isolation-barrier-breaching channel; hold no logic.

## Relationships

Consumed by management; connects to Research/Dataset/Feature/Validation/Backtesting by reference.

## Dependencies

core_domain.shared (EntityId, Ref); standard library.

## Related Governance Documents

CLAUDE.md (SE-2, AC-1/3, AD-3); Architecture V2 §5.5, §6.1; RB-02 · RMET; P2-07.
