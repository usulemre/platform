# messaging · versioning

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define EventSchema (name + version + compatibility), the Compatibility enum, and the SchemaRegistry interface.

## Responsibilities

Govern event schema evolution so historical events remain interpretable and consumers do not break; hold no logic.

## Dependencies

platform_contracts.common (SchemaVersion); standard library.

## Relationships

Enforced by the concrete schema registry (Apicurio, per the TDR).

## Related Governance Documents

CLAUDE.md (VER-1/2, DEPR-1..3); Architecture V2 §5.10; TDR §11/§14.
