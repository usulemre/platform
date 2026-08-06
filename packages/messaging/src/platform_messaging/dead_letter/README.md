# messaging · dead_letter

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define DeadLetterPolicy, DeadLetterRecord (immutable, auditable), and the DeadLetterQueue interface.

## Responsibilities

Express dead-letter handling for exhausted messages as policy + record + interface; hold no logic.

## Dependencies

platform_contracts.common (Id); standard library.

## Relationships

Used with retry/delivery; feeds audit/monitoring.

## Related Governance Documents

CLAUDE.md (RE-1, CP-7); Architecture V2 §5.10; Incident Response Governance.
