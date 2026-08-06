# experiment-service · specifications

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define composable STRUCTURAL experiment specifications: ExperimentSpecification, ReadyToRunSpecification, ReproducibleSpecification.

## Responsibilities

Express reusable, composable structural readiness/reproducibility predicates; never judge significance or decide promotion; hold no logic.

## Relationships

Composed by management; the promotion decision is the deterministic scientific gate's.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (DE-1, AI-2, RP-1, SE-3); Architecture V2 §5.5, §5.6, §6.3; RB-02 · RMET; P2-09.
