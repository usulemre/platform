# data-connectors · provider

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define Provider and ProviderCapabilities: the canonical, vendor-neutral provider model and its capabilities.

## Responsibilities

Represent an external provider and its supported capabilities in vendor-neutral terms; expose no vendor implementation details; hold no logic.

## Dependencies

platform_contracts.common (Id); core (ConnectorType).

## Relationships

Consumed by registry and factory.

## Related Governance Documents

CLAUDE.md (AV2-12, SE-3); Architecture V2 §5.8; RB-06/07 · DATA; TDR §3.
