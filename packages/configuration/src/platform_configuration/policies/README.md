# configuration · policies

> **Phase 1.5 Configuration Foundation — abstractions only.** Technology-independent, deterministic,
> immutable, versionable. No loading, no environment parsing, no secret storage, no persistence,
> no infrastructure, no business logic. Interfaces are placeholders.

## Purpose

Define the deterministic configuration policy interfaces: ConfigurationPolicy, SecretReferencePolicy, ImmutabilityPolicy, ScopeOverridePolicy.

## Responsibilities

Express the rules a deterministic engine enforces (no literal secrets, ACTIVE-immutability, scope precedence) as interfaces; hold no logic.

## Dependencies

model; scope; lifecycle; standard library.

## Relationships

Enforced by the configuration engine; complements validation.

## Related Governance Documents

CLAUDE.md (SEC-3, CODE-29, CP-2, DE-1); Architecture V2 §5.10, §6.5; RB-27 · SEC.
