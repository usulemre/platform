# experiment-service · metadata

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentMetadata: the immutable, auditable, provenance-bearing metadata of an experiment.

## Responsibilities

Carry experiment metadata (identity, description, classification, owner, status, provenance, tags) as data; hold no logic.

## Relationships

Consumed by management and repositories.

## Dependencies

core_domain.shared (Provenance); model; classification; ownership; status.

## Related Governance Documents

CLAUDE.md (CP-7, DP-3); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance.
