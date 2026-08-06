# data-connectors · health

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define HealthState, HealthStatus, and the HealthMonitor interface: connector health monitoring.

## Responsibilities

Represent connector health as immutable data and expose a monitor interface that narrates only; hold no infrastructure or decision logic.

## Dependencies

platform_contracts.common (Id); standard library.

## Relationships

Feeds Production Monitoring; drives lifecycle DEGRADED transitions.

## Related Governance Documents

CLAUDE.md (OB-1/3, EXP-3, RE-2); Architecture V2 §5.8, §5.10; RB-06/07 · DATA; Production Monitoring Governance.
