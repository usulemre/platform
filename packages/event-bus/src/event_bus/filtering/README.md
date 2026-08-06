# event-bus · filtering

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventFilter, EventFilterKind, and the EventFilterEvaluator interface: declarative, deterministic event filtering.

## Responsibilities

Represent filters as immutable declarative data and expose deterministic evaluation; hold no logic.

## Relationships

Consumed by subscriber/dispatcher for subscription filtering.

## Dependencies

envelope (EventEnvelope); standard library.

## Related Governance Documents

CLAUDE.md (DE-1, CS-3); Architecture V2 §5.2, §5.10; RB-20 · CODE.
