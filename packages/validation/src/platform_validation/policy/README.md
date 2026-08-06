# validation · policy

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose

Define the deterministic validation policy interfaces: ValidationPolicy, FailureHandlingPolicy, RevalidationPolicy.

## Responsibilities

Express how validation runs (fail-fast vs collect-all, when to revalidate) as interfaces; hold no logic.

## Dependencies

model (ValidationMode); standard library.

## Relationships

Applied by the pipeline; supports revalidation/partial/incremental/composite modes.

## Related Governance Documents

CLAUDE.md (DE-1, CP-6, DP-2); Architecture V2 §5.10; RB-20 · CODE.
