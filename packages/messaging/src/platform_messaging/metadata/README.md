# messaging · metadata

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define MessageHeader (identity, version, correlation, causation, supplied time, actor, content-type label) and MessageMetadata.

## Responsibilities

Carry the transport-neutral header/metadata that make every message identifiable, versioned, and traceable; hold no serialization.

## Dependencies

platform_contracts.common (Id, SchemaVersion, ActorRef); correlation; causation.

## Relationships

Used by message_model (envelope), command_model, query_model.

## Related Governance Documents

CLAUDE.md (CP-7, CS-3, VER-1); Architecture V2 §5.10; RB-20 · CODE.
