# data-connectors · rate_limit

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define RateLimitPolicy: provider rate limiting as immutable configuration values.

## Responsibilities

Express rate-limit semantics as declarative data; the concrete adapter enforces them; hold no logic.

## Dependencies

Standard library only.

## Relationships

Consumed by configuration (ConnectionProfile).

## Related Governance Documents

CLAUDE.md (RE-1, SC-3); Architecture V2 §5.8, §10; RB-06/07 · DATA.
