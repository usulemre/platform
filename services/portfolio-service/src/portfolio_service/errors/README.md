# portfolio-service · errors

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define the Portfolio Engine errors: IneligibleAlpha, GrossOptimization, ConstraintViolation, AIAllocationDecision, SignalReadjudication, ExecutionAuthorityAttempt, ImmutableSnapshotMutation, IllegalPortfolioTransition.

## Responsibilities

Express violated portfolio invariants (eligible-only, net-of-cost, constraint-respecting, deterministic allocation, no re-adjudication, no execution, snapshot immutability, lifecycle) as errors.

## Relationships

Used across the Portfolio Engine modules.

## Dependencies

core_domain.shared (DomainError); aligns with core_domain.portfolio errors.

## Related Governance Documents

CLAUDE.md (PS-1..4, RS-1, AI-1, CP-2); Architecture V2 §5.6, §6.3; RB-12 · PORT; RB-13 · RISK; P1-08.
