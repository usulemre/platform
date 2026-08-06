# validation · context

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose

Define ValidationContext: the immutable, deterministic context (subject, category, actor, correlation, as-of) for a validation run.

## Responsibilities

Carry validation context by value; supply the as-of boundary for PIT reads; read no ambient time.

## Dependencies

platform_contracts.common (Id, ActorRef, CorrelationId); model (ValidationCategory).

## Relationships

Consumed by validators and the pipeline.

## Related Governance Documents

CLAUDE.md (PIT-1, CS-3, CP-7); Architecture V2 §5.10; RB-08 · PIT.
