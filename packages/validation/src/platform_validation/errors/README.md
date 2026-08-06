# validation · errors

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose

Define ValidationErrorCode, ValidationFrameworkError (base), and ValidationError: framework-level errors distinct from a validation failure.

## Responsibilities

Express framework faults (misuse, illegal transitions) as errors; a validation FAILURE is a legitimate outcome, not an error.

## Dependencies

Standard library only.

## Relationships

Used across the framework modules.

## Related Governance Documents

CLAUDE.md (CP-7, DE-2); Architecture V2 §5.10; RB-20 · CODE.
