# signal-service · dependencies

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalDependency, DependencyKind, and SignalDependencyService: declared links to features, experiments, backtests, risk, and upstream signals.

## Responsibilities

Represent cross-context dependencies by identity only; declare all dependencies explicitly; never breach the isolation barrier; hold no logic.

## Relationships

Consumed by model (evidence), governance, repositories; connects to Feature/Experiment/Backtesting/Risk by reference.

## Dependencies

core_domain.shared (EntityId, Ref); standard library.

## Related Governance Documents

CLAUDE.md (SE-2, AC-1/3, AD-3); Architecture V2 §5.5, §6.1; RB-09/10 · FAR; P2-07.
