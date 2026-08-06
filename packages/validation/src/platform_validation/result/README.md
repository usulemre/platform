# validation · result

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose

Define ValidationResult, ValidationSuccess, and ValidationFailure: the immutable outcome of a structural validation.

## Responsibilities

Represent validation outcomes as immutable data (status + successes + failures); a failure is structural, not a scientific verdict.

## Dependencies

platform_contracts.common (Violation); model (Severity, ValidationStatus).

## Relationships

Produced by validators; aggregated by report; consumed by pipeline.

## Related Governance Documents

CLAUDE.md (CP-2/7, AI-2); Architecture V2 §5.10; RB-20 · CODE.
