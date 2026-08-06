# data-connectors · request

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define DataRequest and TimeRange: the canonical, vendor-neutral data request.

## Responsibilities

Represent a data request in vendor-neutral terms (symbols, fields, time range, correlation); contain no provider-specific fields; hold no logic.

## Dependencies

platform_contracts.common (CorrelationId); standard library.

## Relationships

Consumed by core (Connector.fetch); the adapter translates it to a provider call (out of scope).

## Related Governance Documents

CLAUDE.md (AV2-12, SE-2, CP-7, CS-3); Architecture V2 §5.8; RB-06/07 · DATA.
