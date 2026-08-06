# event-bus · subscriber

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventSubscription and the EventSubscriber interface: subscribe, handle, and acknowledge delivered events.

## Responsibilities

Express topic subscription (ACL/isolation-aware), event handling, and acknowledgement as an interface; hold no broker/queue/transport.

## Relationships

Consumed by all consuming contexts; restricted topics enforce the isolation barrier.

## Dependencies

core_domain.shared (DomainEvent); core (EventTopic); standard library.

## Related Governance Documents

CLAUDE.md (AC-1/3, CP-7); Architecture V2 §5.2, §5.10, §6.1; P2-07, P5-04.
