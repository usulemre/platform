# data-connectors · errors

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define ConnectorError, ConnectorErrorKind, and ConnectorFrameworkError: the canonical, vendor-neutral error model.

## Responsibilities

Express connector errors in vendor-neutral terms (auth/rate-limit/timeout/unavailable/invalid/quarantine/vendor-leak); leak no provider details; hold no logic.

## Dependencies

Standard library only.

## Relationships

Used across the framework modules; QUARANTINE_REQUIRED feeds ingestion quarantine (DI-2).

## Related Governance Documents

CLAUDE.md (DI-2, AV2-12, SE-2, CP-7); Architecture V2 §5.8, §6.4; RB-06/07 · DATA; Dataset Governance.
