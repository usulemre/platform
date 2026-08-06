# validation · metadata

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose

Define ValidationMetadata: validator id, category, version, lifecycle, owner, and supplied creation time.

## Responsibilities

Carry immutable, auditable, versioned validation metadata; data only.

## Dependencies

platform_contracts.common (SchemaVersion); model (ValidationCategory, ValidationLifecycle).

## Relationships

Consumed by report and registry.

## Related Governance Documents

CLAUDE.md (CP-7, VER-1, CS-3); Architecture V2 §5.10; RB-20 · CODE.
