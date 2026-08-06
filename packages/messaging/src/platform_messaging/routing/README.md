# messaging · routing

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define message routing: RoutingKey, TopicPartition, Route, and the Router interface.

## Responsibilities

Resolve an envelope to a destination topic/partition deterministically; hold no transport or broker logic.

## Dependencies

message_model (MessageEnvelope); standard library.

## Relationships

Used with event_bus; partitions map to P5-04 topic partitions.

## Related Governance Documents

CLAUDE.md (SC-3, CS-3); Architecture V2 §5.10; P5-04.
