# experiment-service · configuration

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentConfiguration and ExperimentConfigurationService: the immutable, reproducibility-bearing configuration and its assignment.

## Responsibilities

Represent configuration (config hash, dataset/feature references by identity, non-secret parameters) as immutable data bound into the manifest; hold no logic; inline no secrets.

## Relationships

Consumed by model, management, specifications; references datasets/features by identity.

## Dependencies

core_domain.shared (EntityId, Ref); standard library.

## Related Governance Documents

CLAUDE.md (EX-3, RP-1, SEC-3, SE-2); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance.
