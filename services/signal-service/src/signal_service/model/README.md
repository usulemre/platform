# signal-service · model

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define the canonical signal models: Signal (aggregate), SignalIdentifier, SignalEvidence, SignalPriority (reusing core SignalSpec).

## Responsibilities

Represent a signal as an immutable, deterministic, net-of-cost aggregate that references all upstream evidence by identity (traceability); hold no generation algorithm, no portfolio/execution logic.

## Relationships

Consumed by every Signal Engine module; references Feature/Experiment/Backtesting/Risk by identity; reuses core_domain.signal.

## Dependencies

core_domain.signal (SignalSpec); core_domain.shared (AggregateRoot, Provenance, Ref, Version); classification; status.

## Related Governance Documents

CLAUDE.md (AD-1/3, RS-1, CP-2/5/7, NM-2); Architecture V2 §5.5, §6.1; RB-09/10 · FAR; Signal Registry; P2-07.
