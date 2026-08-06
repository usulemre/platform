# configuration · profiles

> **Phase 1.5 Configuration Foundation — abstractions only.** Technology-independent, deterministic,
> immutable, versionable. No loading, no environment parsing, no secret storage, no persistence,
> no infrastructure, no business logic. Interfaces are placeholders.

## Purpose

Define ConfigurationProfile and ProfileKind: named environment/deployment/local profiles for environment separation.

## Responsibilities

Represent profiles declaratively for environment separation; hold no environment parsing or loading.

## Dependencies

platform_contracts.common (SchemaVersion); scope; standard library.

## Relationships

Consumed by the configuration engine and deployment; relates to configs/environments.

## Related Governance Documents

CLAUDE.md (DEP-1, SEC-3); Architecture V2 §5.9, §5.10; RB-27 · SEC; TDR §20.
