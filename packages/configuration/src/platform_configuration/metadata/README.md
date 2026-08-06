# configuration · metadata

> **Phase 1.5 Configuration Foundation — abstractions only.** Technology-independent, deterministic,
> immutable, versionable. No loading, no environment parsing, no secret storage, no persistence,
> no infrastructure, no business logic. Interfaces are placeholders.

## Purpose

Define ConfigurationMetadata: name, accountable owner, description, scope, version, lifecycle, and schema reference.

## Responsibilities

Carry immutable governance metadata for a configuration; reference (never inline) the schema; data only.

## Dependencies

platform_contracts.common (SchemaVersion); scope; lifecycle.

## Relationships

Consumed by model and registry.

## Related Governance Documents

CLAUDE.md (CP-2/7, VER-1); Architecture V2 §5.10; RB-27 · SEC.
