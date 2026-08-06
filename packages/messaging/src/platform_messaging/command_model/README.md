# messaging · command_model

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define the command messaging model: the Command payload base (re-exported), CommandMessage envelope, and the CommandHandler interface.

## Responsibilities

Represent imperative requests to deterministic engines/services as messages; a command never decides itself.

## Dependencies

platform_contracts.common (Command, Response); metadata; standard library.

## Relationships

Consumed by routing; targets deterministic engines/services.

## Related Governance Documents

CLAUDE.md (DE-1, AI-1); Architecture V2 §5.10, §6.3; RB-20 · CODE.
