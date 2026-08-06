# data-connectors · metadata

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define ConnectorMetadata: the immutable, auditable metadata of a connector.

## Responsibilities

Carry connector metadata (identity, type, provider, owner, status, tags) as data; hold no logic.

## Dependencies

platform_contracts.common (Id); core (ConnectorIdentifier, ConnectorType); lifecycle (ConnectionStatus).

## Relationships

Consumed by registry and health/monitoring.

## Related Governance Documents

CLAUDE.md (CP-7, OB-1); Architecture V2 §5.8; RB-06/07 · DATA.
