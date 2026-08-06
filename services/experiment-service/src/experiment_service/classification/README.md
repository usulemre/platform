# experiment-service · classification

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentClassification with ExperimentKind and ExperimentDomain enums (asset-agnostic option preserved).

## Responsibilities

Classify experiments within the shared vocabulary; the core never branches on asset class; data only.

## Relationships

Consumed by model, metadata, specifications.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (KM-3, CP-8, NM-1); Architecture V2 §5.5; RB-02 · RMET.
