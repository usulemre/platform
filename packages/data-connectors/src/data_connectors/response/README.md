# data-connectors · response

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define DataResponse and ResponseStatus: the canonical, vendor-neutral data response with an opaque, quarantine-bound payload reference.

## Responsibilities

Represent a response as a status + opaque content-addressed payload reference; expose no provider model; route raw data to the raw vault/quarantine, never to research; hold no logic.

## Dependencies

platform_contracts.common (ContentHash); standard library.

## Relationships

Produced by core (Connector.fetch); feeds the ingestion/certification pipeline (out of scope).

## Related Governance Documents

CLAUDE.md (DI-1/2, AV2-12, SE-2, CP-6); Architecture V2 §5.8, §6.4; RB-06/07 · DATA; Dataset Governance.
