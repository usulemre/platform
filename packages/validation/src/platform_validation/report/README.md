# validation · report

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose

Define ValidationReport and ReportSummary: the immutable, auditable aggregation of validation results.

## Responsibilities

Aggregate results with metadata and a summary as immutable data; hold no logic.

## Dependencies

result (ValidationResult); metadata (ValidationMetadata).

## Relationships

Produced by the pipeline; consumed by audit/governance and human review.

## Related Governance Documents

CLAUDE.md (CP-7, EXP-2); Architecture V2 §5.10; RB-20 · CODE.
