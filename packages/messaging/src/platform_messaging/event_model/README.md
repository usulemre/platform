# messaging · event_model

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define the event taxonomy (EventCategory, 14 categories), EventKind, the canonical EventLifecycle, EventMetadata, and the base event kinds (Event, DomainEvent, IntegrationEvent, SystemEvent, AuditEvent).

## Responsibilities

Classify and envelope events immutably with category, kind, lifecycle, correlation, and causation; hold no logic. Concrete events live in the contract/workflow layers.

## Dependencies

correlation; causation; standard library.

## Relationships

Consumed by event_bus; complements platform_contracts payload events.

## Related Governance Documents

CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.10; Workflow/Signal/Dataset events; SEC-4.
