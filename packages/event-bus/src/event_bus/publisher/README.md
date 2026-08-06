# event-bus · publisher

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventPublisher: the interface to publish a canonical domain event to a topic.

## Responsibilities

Express publication of registered canonical domain events to topics as an interface; hold no broker/queue/transport.

## Relationships

Consumed by all producing contexts; realized by the concrete bus (Kafka) behind the interface.

## Dependencies

core_domain.shared (DomainEvent); core (EventTopic); standard library.

## Related Governance Documents

CLAUDE.md (AC-1, CP-7); Architecture V2 §5.2, §5.10; P5-04; TDR §14.
