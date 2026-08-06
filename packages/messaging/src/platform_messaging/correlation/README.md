# messaging · correlation

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define the correlation model: CorrelationId (re-exported from the contract kernel) and CorrelationContext, grouping all messages of one logical flow.

## Responsibilities

Carry the correlation id that gives end-to-end traceability across a workflow/run; data only.

## Dependencies

platform_contracts.common (CorrelationId); standard library.

## Relationships

Used by metadata, event_model, and every message header.

## Related Governance Documents

CLAUDE.md (CP-7, OB-1); Architecture V2 §5.10; Workflow Contracts (traceability).
