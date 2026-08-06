# experiment-service · ownership

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define ExperimentOwner and the ExperimentOwnershipService interface: accountable ownership and its transfer.

## Responsibilities

Represent accountable ownership as data and its transfer as a recorded, interface-only operation; hold no logic.

## Relationships

Consumed by model, metadata, management.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (CP-7, HO-1); Architecture V2 §5.5; RB-02 · RMET.
