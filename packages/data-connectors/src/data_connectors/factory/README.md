# data-connectors · factory

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define ConnectorFactory: constructs canonical Connectors from a provider, connection profile, and auth profile.

## Responsibilities

Express connector construction as an interface returning a vendor-neutral Connector; the concrete adapter plugs in behind it; hold no adapter or provider logic.

## Dependencies

platform_contracts.common (Id); core (Connector); configuration (ConnectionProfile); authentication (AuthenticationProfile).

## Relationships

Consumed by platform services; makes new providers pluggable (extensibility).

## Related Governance Documents

CLAUDE.md (AV2-12, SE-3); Architecture V2 §5.8; RB-06/07 · DATA; TDR §3.
