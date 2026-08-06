# messaging · causation

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define the causation model: CausationId and CausationContext, capturing the direct cause of each message.

## Responsibilities

Carry the causation link that, with correlation, reconstructs the full causal chain of a flow; data only.

## Dependencies

Standard library only.

## Relationships

Used by metadata and event_model.

## Related Governance Documents

CLAUDE.md (CP-7); Architecture V2 §5.10; Observability/Audit spine.
