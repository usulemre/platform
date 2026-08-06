# event-bus · dead_letter

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Re-export the messaging dead-letter primitives (DeadLetterPolicy/Record/Queue) and define DeadLetterRouter.

## Responsibilities

Express dead-letter handling for exhausted events (policy, immutable record, queue, router) as interfaces; hold no logic.

## Relationships

Reuses platform_messaging.dead_letter; consumed by dispatcher; feeds audit/monitoring and replay.

## Dependencies

platform_messaging.dead_letter (DeadLetterPolicy, DeadLetterRecord, DeadLetterQueue); standard library.

## Related Governance Documents

CLAUDE.md (RE-1, CP-7); Architecture V2 §5.10; Incident Response Governance.
