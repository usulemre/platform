# experiment-service · management

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define the Experiment Service interfaces: ExperimentService (lifecycle), ExperimentManagementService (dependency/gate orchestration), ExperimentCatalogService.

## Responsibilities

Orchestrate the experiment lifecycle and connect Research/Datasets/Features/Validation/Backtesting by dependency; record (never compute) deterministic gate outcomes; hold no adjudication, statistics, or backtests.

## Relationships

Top-level module: composes model, dependencies, metadata, registration, execution/validation coordination; routes to deterministic engines.

## Dependencies

core_domain.shared (EntityId); model; dependencies; metadata.

## Related Governance Documents

CLAUDE.md (CP-5, AI-2, AD-3, DE-1, SM-3); Architecture V2 §5.5, §6.1, §6.3; RB-02 · RMET; P2-01/07/09.
