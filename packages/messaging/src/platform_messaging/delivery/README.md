# messaging · delivery

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define DeliveryPolicy: the delivery guarantee (at-most/at-least/exactly-once) and ordering (none/partition/global).

## Responsibilities

Express delivery semantics as immutable policy data enforced by the concrete bus; hold no logic.

## Dependencies

Standard library only.

## Relationships

Consumed by the event_bus adapter and consumers.

## Related Governance Documents

CLAUDE.md (RE-1, SC-3); Architecture V2 §5.10, §10; P5-04.
