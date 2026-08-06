# portfolio-service · optimization

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioOptimizationInterface and re-export the deterministic PortfolioOptimizer / OptimizationConstraints (from core_domain.portfolio).

## Responsibilities

Express deterministic, net-of-cost, constraint-respecting optimization as an interface; hold no optimization algorithm or allocation mathematics; no AI decides allocation.

## Relationships

Consumed by construction; the concrete optimizer plugs in behind this interface (golden-tested).

## Dependencies

core_domain.portfolio (PortfolioOptimizer, OptimizationConstraints); core_domain.shared (EntityId); allocation.

## Related Governance Documents

CLAUDE.md (PS-2/3, AI-1, DE-1/2); Architecture V2 §5.6, §6.3; RB-12 · PORT; P1-08.
