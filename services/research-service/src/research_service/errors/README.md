# research-service · errors

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define the Research Service errors: ResearchNotRegistered, PreRegistrationAltered, ResearchSelfAdjudication, IsolationBarrierBreach, NegativeResultDiscarded, IllegalResearchTransition, UndeclaredDependency.

## Responsibilities

Express violated research invariants (register-before-run, pre-registration lock, separation of powers, isolation barrier, negative-results, lifecycle, declared dependencies) as errors.

## Relationships

Used across the Research Service modules.

## Dependencies

core_domain.shared (DomainError).

## Related Governance Documents

CLAUDE.md (SM-1/2/4, AD-3, CP-5, FB-8, SE-2); Architecture V2 §5.5, §6.1; RB-02 · RMET; P2-07.
