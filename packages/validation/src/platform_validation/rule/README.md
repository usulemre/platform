# validation · rule

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose

Define ValidationRule (a named, versioned, severity-bearing rule) and the RuleEvaluator interface.

## Responsibilities

Represent structural rules as immutable data with a deterministic evaluator interface; hold no rule logic (that lives in an outer engine).

## Dependencies

model (Severity); standard library.

## Relationships

Composed by specifications and the pipeline.

## Related Governance Documents

CLAUDE.md (DE-1/2, CS-2); Architecture V2 §5.10; RB-20 · CODE.
