# event-bus · errors

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventBusError, EventBusErrorKind, and EventBusFrameworkError: the canonical, vendor-neutral error model.

## Responsibilities

Express Event Bus errors in vendor-neutral terms (unregistered/schema-incompatible/non-domain/isolation/untraceable/delivery/dead-letter); leak no vendor details; hold no logic.

## Relationships

Used across the Event Bus modules.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (AC-3, VER-1/2, CP-7, AD-3); Architecture V2 §5.2, §5.10, §6.1; P2-07.
