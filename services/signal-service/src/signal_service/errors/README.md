# signal-service · errors

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define the Signal Engine errors: SignalMissingRiskApproval, GrossSignalSelection, GeneratorObservedValidation, MLSignalDecision, PortfolioConstructionAttempt, ExecutionAuthorityAttempt, SignalNotRegistered, IllegalSignalTransition, UndeclaredDependency.

## Responsibilities

Express violated signal invariants (mandatory Risk approval, net-of-cost, isolation, deterministic decision, no portfolio/execution, register-before-use, lifecycle, declared dependencies) as errors.

## Relationships

Used across the Signal Engine modules.

## Dependencies

core_domain.shared (DomainError); aligns with core_domain.signal errors.

## Related Governance Documents

CLAUDE.md (RS-1, AD-1/3, DE-1, AI-1, PS-1, SE-2); Architecture V2 §5.5, §6.1, §6.3; RB-09/10 · FAR; RB-13 · RISK; P2-07.
