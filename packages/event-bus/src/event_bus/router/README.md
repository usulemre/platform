# event-bus · router

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventRoutingRule and the EventRouter interface: deterministic routing of envelopes to destination topics.

## Responsibilities

Represent routing rules as immutable data and expose deterministic routing; respect topic restrictions; hold no transport.

## Relationships

Consumed by dispatcher; reuses the messaging RoutingKey; operates on envelopes.

## Dependencies

platform_messaging.routing (RoutingKey); core (EventTopic); envelope (EventEnvelope).

## Related Governance Documents

CLAUDE.md (AC-3, CS-3, SC-3); Architecture V2 §5.2, §5.10, §6.1; P5-04, P2-07.
