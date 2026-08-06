# experiment-service · archival

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentArchivalService: archive completed/approved experiments while preserving reproducibility and negative results.

## Responsibilities

Coordinate archival; never GC reproducibility-critical manifests; preserve negative/discarded experiments; hold no logic.

## Relationships

core_domain.shared (EntityId).

## Dependencies

Consumed by management; terminal lifecycle step.

## Related Governance Documents

CLAUDE.md (RP-4, SM-4, DEPR-2); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance; P5-01.
