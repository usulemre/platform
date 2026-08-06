# validation · registry

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose

Define ValidationRecord and the ValidationRegistry interface: the append-only inventory of validators.

## Responsibilities

Express register-before-use validator existence as an interface; hold no persistence.

## Dependencies

platform_contracts.common (Id); metadata; model (ValidationCategory).

## Relationships

Consumed by the pipeline and governance/audit.

## Related Governance Documents

CLAUDE.md (CP-7, DE-2); Architecture V2 §5.10; RB-20 · CODE.
