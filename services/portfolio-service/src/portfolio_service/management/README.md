# portfolio-service · management

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define the Portfolio Engine service interfaces: PortfolioService (lifecycle), PortfolioEngineService (deterministic decision gate), PortfolioCatalogService.

## Responsibilities

Orchestrate the portfolio lifecycle and gate approval on validation + independent risk review; deterministic and net-of-cost; hold no execution authority and no AI allocation decision.

## Relationships

Top-level module: composes model, construction, optimization, allocation/constraints/exposure/diversification, validation/approval, registry.

## Dependencies

core_domain.shared (EntityId); model; metadata.

## Related Governance Documents

CLAUDE.md (PS-1..4, RS-1/2, AI-1, DE-1); Architecture V2 §5.6, §6.3; RB-12 · PORT; RB-13 · RISK; Portfolio Registry.
