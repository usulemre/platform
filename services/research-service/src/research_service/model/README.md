# research-service · model

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define the canonical research models: Research (aggregate), ResearchIdentifier, ResearchObjective, ResearchHypothesis, ResearchEvidence, ResearchReference, ResearchPriority.

## Responsibilities

Represent a research initiative as an immutable, provenance-bearing aggregate that proposes and records; reuse the core research domain for prediction/rationale; hold no logic and no adjudication.

## Relationships

Consumed by every other Research Service module; references core_domain.research.Hypothesis by identity.

## Dependencies

core_domain.research (EconomicRationale, FalsifiablePrediction); core_domain.shared (AggregateRoot, Provenance, Ref, Version); classification; ownership; status.

## Related Governance Documents

CLAUDE.md (SM-1/4, AD-2/3, CP-2/5/7, RL-1, NM-2); Architecture V2 §5.5, §6.1; RB-02 · RMET; P2-07.
