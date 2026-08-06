# signal-service · metadata

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalMetadata: the immutable, auditable, provenance-bearing metadata of a signal.

## Responsibilities

Carry signal metadata (identity, description, owner, classification, status, priority, provenance, tags) as data; hold no logic.

## Relationships

Consumed by management and repositories.

## Dependencies

core_domain.shared (Provenance); model; classification; status.

## Related Governance Documents

CLAUDE.md (CP-7, DP-3); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry.
