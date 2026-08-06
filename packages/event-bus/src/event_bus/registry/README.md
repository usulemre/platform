# event-bus · registry

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventRegistration and the EventRegistry interface: the register-before-publish registry of canonical event types/schemas.

## Responsibilities

Express register-before-publish and versioned registration of event types as an interface; only registered types may be published; hold no persistence.

## Relationships

Consumed by publisher and validation; complements the messaging schema registry.

## Dependencies

platform_contracts.common (SchemaVersion); platform_messaging.event_model (EventCategory); standard library.

## Related Governance Documents

CLAUDE.md (VER-1/2, CP-7, AC-1); Architecture V2 §5.2, §5.10; RB-20 · CODE.
