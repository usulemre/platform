# signal-service · ranking

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalRank and SignalRankingService: the rank model and ranking interface.

## Responsibilities

Represent ranks as immutable data produced by the deterministic ranking engine; hold no ranking algorithm.

## Relationships

Consumed by management; the deterministic ranking engine plugs in behind the interface.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (DE-1, AI-2); Architecture V2 §5.5, §6.3; RB-09/10 · FAR.
