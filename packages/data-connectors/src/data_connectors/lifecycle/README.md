# data-connectors · lifecycle

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define ConnectorLifecycle (REGISTERED/CONFIGURED/INITIALIZED/CONNECTED/ACTIVE/DEGRADED/DISCONNECTED/RETIRED), the canonical transitions, ConnectionStatus, and the lifecycle service (reconnect/health-check/capability-refresh/graceful-shutdown).

## Responsibilities

Enumerate the connector lifecycle and legal transitions as data and expose the lifecycle operations as an interface; hold no infrastructure or provider logic.

## Dependencies

platform_contracts.common (Id); standard library.

## Relationships

Consumed by core, metadata, factory, registry.

## Related Governance Documents

CLAUDE.md (AV2-12, RE-1, CS-3); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
