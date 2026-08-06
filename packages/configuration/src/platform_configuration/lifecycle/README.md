# configuration · lifecycle

> **Phase 1.5 Configuration Foundation — abstractions only.** Technology-independent, deterministic,
> immutable, versionable. No loading, no environment parsing, no secret storage, no persistence,
> no infrastructure, no business logic. Interfaces are placeholders.

## Purpose

Define ConfigurationLifecycle (DRAFT/VALIDATED/APPROVED/ACTIVE/DEPRECATED/RETIRED + INVALID/REJECTED/SUSPENDED), the canonical transitions, and terminal states.

## Responsibilities

Enumerate the lifecycle and its legal transitions as data; a deterministic engine enforces them fail-closed. No logic here.

## Dependencies

Standard library (enum) only.

## Relationships

Consumed by metadata, policies, registry.

## Related Governance Documents

CLAUDE.md (CP-2, DEPR-1..3); Architecture V2 §5.10; RB-27 · SEC.
