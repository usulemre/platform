# data-connectors · retry

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define RetryPolicy and BackoffStrategy: retry/backoff as immutable configuration values.

## Responsibilities

Express retry semantics as declarative data; the concrete adapter applies them; no timers or clock reads here.

## Dependencies

Standard library only.

## Relationships

Consumed by configuration (ConnectionProfile).

## Related Governance Documents

CLAUDE.md (RE-1, CS-3); Architecture V2 §5.8, §10; RB-06/07 · DATA.
