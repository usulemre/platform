# signal-service · scoring

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalScore, SignalConfidence, and SignalScoringService: the score/confidence value model and scoring interface.

## Responsibilities

Represent scores/confidence as deterministic VALUES referenced from the deterministic engine; hold no scoring formula and no ML.

## Relationships

Consumed by ranking, decision, reporting; the deterministic scoring engine plugs in behind the interface.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (DE-1, AI-2, SI-3); Architecture V2 §5.5, §6.3; RB-09/10 · FAR.
