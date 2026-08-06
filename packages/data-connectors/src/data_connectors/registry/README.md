# data-connectors · registry

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define ProviderRegistry: the register-before-use registry of providers and connectors.

## Responsibilities

Express register-before-use registration and retrieval of providers/connectors as an interface; hold no persistence; leak no provider details.

## Dependencies

platform_contracts.common (Id); core (Connector); provider (Provider).

## Relationships

Consumed by factory and platform services obtaining connectors.

## Related Governance Documents

CLAUDE.md (AV2-12, CP-7, SE-3); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
