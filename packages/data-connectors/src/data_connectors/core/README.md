# data-connectors · core

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define ConnectorType (8 types), ConnectorIdentifier, Connector, the ConnectorProtocol interface, and the eight connector-type marker protocols (MarketData/Exchange/Broker/Fundamental/Alternative/News/Macro/Reference).

## Responsibilities

Provide the canonical, vendor-neutral connector model and interface; connect/disconnect/fetch use canonical models only; expose no provider-specific models; hold no client/provider logic.

## Dependencies

platform_contracts.common (Id, SchemaVersion); lifecycle (ConnectionStatus); request (DataRequest); response (DataResponse).

## Relationships

Consumed by registry, factory, metadata; implemented by concrete adapters behind these interfaces.

## Related Governance Documents

CLAUDE.md (AV2-12, SE-2/3, CP-8, NM-2); Architecture V2 §5.8, §6.4; RB-06/07 · DATA; TDR §3.
