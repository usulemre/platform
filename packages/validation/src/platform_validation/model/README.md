# validation · model

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose

Define the validation taxonomy (ValidationCategory, 11 categories), the canonical ValidationLifecycle, ValidationMode (full/partial/incremental/composite/revalidation), Severity, ValidationStatus, the Validation record, and the Validator interface.

## Responsibilities

Provide the core structural-validation model and interface; assert NO statistical significance; hold no logic.

## Dependencies

platform_contracts.common (Id); standard library.

## Relationships

Consumed by every other validation module; distinct from the deterministic statistical Validation engine.

## Related Governance Documents

CLAUDE.md (AI-2, DE-1/4, VS-1); Architecture V2 §5.6, §5.10; RB-01 · STAT (separation); RB-20 · CODE.
