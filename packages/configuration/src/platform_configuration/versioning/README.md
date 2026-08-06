# configuration · versioning

> **Phase 1.5 Configuration Foundation — abstractions only.** Technology-independent, deterministic,
> immutable, versionable. No loading, no environment parsing, no secret storage, no persistence,
> no infrastructure, no business logic. Interfaces are placeholders.

## Purpose

Define ConfigurationVersion (name + version + supersedes + compatibility), the Compatibility enum, and the VersioningPolicy interface.

## Responsibilities

Govern configuration versioning so historical configurations remain interpretable and changes are compatible; data + interface, no logic.

## Dependencies

platform_contracts.common (SchemaVersion); standard library.

## Relationships

Consumed by metadata and registry.

## Related Governance Documents

CLAUDE.md (VER-1/2, CP-2, RP-1); Architecture V2 §5.10; RB-27 · SEC.
