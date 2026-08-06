# configuration · model

> **Phase 1.5 Configuration Foundation — abstractions only.** Technology-independent, deterministic,
> immutable, versionable. No loading, no environment parsing, no secret storage, no persistence,
> no infrastructure, no business logic. Interfaces are placeholders.

## Purpose

Define the configuration model: Configuration, ConfigEntry, ConfigKey, ConfigValue, ValueKind, and SecretRef (secrets held ONLY as references).

## Responsibilities

Represent an immutable, versioned configuration as data; hold secret references, never secret values (SEC-3); no loading/parsing.

## Dependencies

platform_contracts.common (VersionTag); metadata; scope.

## Relationships

Consumed by validation, policies, registry.

## Related Governance Documents

CLAUDE.md (SEC-3, CODE-29, FB-14, CP-2); Architecture V2 §5.10, §6.5; RB-27 · SEC; TDR §19/§20.
