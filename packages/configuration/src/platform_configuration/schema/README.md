# configuration · schema

> **Phase 1.5 Configuration Foundation — abstractions only.** Technology-independent, deterministic,
> immutable, versionable. No loading, no environment parsing, no secret storage, no persistence,
> no infrastructure, no business logic. Interfaces are placeholders.

## Purpose

Define ConfigurationSchema, FieldSpec, FieldType (incl. SECRET_REF), and Constraint: the declarative schema a configuration is validated against.

## Responsibilities

Describe configuration shape and constraints as immutable, versioned data; mark secret fields as references; hold no validation logic.

## Dependencies

platform_contracts.common (SchemaVersion); standard library.

## Relationships

Consumed by validation; referenced by metadata/model.

## Related Governance Documents

CLAUDE.md (SEC-3, VER-1, CS-5); Architecture V2 §5.10, §6.5; RB-27 · SEC; TDR §20.
