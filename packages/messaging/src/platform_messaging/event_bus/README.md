# messaging · event_bus

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define the event-bus abstraction: Topic (partitioned + ACL/restriction-aware), EventPublisher, EventSubscriber, and EventBus interfaces.

## Responsibilities

Express publish/subscribe over a partitioned, ACL-governed bus; encode isolation-awareness via restricted topics; hold no broker/transport.

## Dependencies

event_model (Event); standard library.

## Relationships

Realized by the concrete bus (Kafka, per the TDR); enforces the isolation barrier via ACLs.

## Related Governance Documents

CLAUDE.md (AC-1/3, SC-3); Architecture V2 §5.2, §5.10, §6.1 (AV2-16); P5-04, P2-07; TDR §14.
