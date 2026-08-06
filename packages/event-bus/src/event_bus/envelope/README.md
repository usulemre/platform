# event-bus · envelope

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventEnvelope: the transport-neutral wrapper carrying a canonical domain event + metadata + topic.

## Responsibilities

Wrap a canonical domain event with its metadata and destination topic immutably; transport domain events only; hold no serialization or transport.

## Relationships

Consumed by router, dispatcher, validation, filtering; carries a core_domain DomainEvent.

## Dependencies

core_domain.shared (DomainEvent); core (EventIdentifier, EventTopic); metadata (EventMetadata).

## Related Governance Documents

CLAUDE.md (CP-2/7, AC-1); Architecture V2 §5.2, §5.10; RB-20 · CODE.
