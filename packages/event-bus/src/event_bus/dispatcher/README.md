# event-bus · dispatcher

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventDispatcher: the interface to dispatch routed events to subscribers under delivery/retry/dead-letter policies.

## Responsibilities

Express dispatch/delivery to subscribers as an interface honoring policies and the isolation barrier; hold no queue/broker/transport.

## Relationships

Consumes router output; applies retry/dead-letter policies; delivers to subscribers.

## Dependencies

envelope (EventEnvelope); standard library.

## Related Governance Documents

CLAUDE.md (AC-1/3, RE-1); Architecture V2 §5.2, §5.10, §6.1; P2-07, P5-04.
