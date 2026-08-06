# signal-service · repositories

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define the Signal Engine repository interfaces: SignalRepositoryContract (append-only), SignalScoreRepository, SignalDependencyRepository.

## Responsibilities

Express append-only, immutable retrieval of signals, scores, and dependencies as interfaces; hold no persistence.

## Relationships

Consumed by management; complements core_domain.signal repositories and the Signal Registry.

## Dependencies

core_domain.shared (EntityId); model; scoring; dependencies.

## Related Governance Documents

CLAUDE.md (CP-2, RL-2, DP-1); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry.
