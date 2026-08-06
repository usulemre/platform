# experiment-service · model

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

## Purpose

Define the canonical experiment models: Experiment (aggregate), ExperimentIdentifier, ExperimentObjective, ExperimentHypothesis, ExperimentEvidence, ExperimentResultReference, plus reuse of the immutable ExperimentManifest.

## Responsibilities

Represent an experiment as an immutable, manifest-bearing, reproducible aggregate that orchestrates and records; reference research/results by identity; hold no logic, no statistics, no adjudication.

## Relationships

Consumed by every Experiment Service module; references Research/results by identity; reuses core_domain.experiment.ExperimentManifest.

## Dependencies

core_domain.experiment (ExperimentManifest); core_domain.research (FalsifiablePrediction); core_domain.shared (AggregateRoot, Provenance, Ref, RunManifestRef, Version); classification; ownership; status.

## Related Governance Documents

CLAUDE.md (SM-1/4/5, EX-1..3, RP-1/3, AD-3, CP-2/5/7, RL-1, NM-2); Architecture V2 §5.5, §6.1; RB-02 · RMET; RB-01 · STAT; P2-01/07.
