# portfolio-service · policies

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define the deterministic portfolio policy interfaces: PortfolioPolicy, AllocationPolicy, ConstraintPolicy, EligibleAlphaPolicy, DeterministicAllocationPolicy, NoExecutionAuthorityPolicy.

## Responsibilities

Express the portfolio-construction rules (net-of-cost, constraint-respecting, eligible-only, deterministic allocation, no execution) as interfaces; hold no logic.

## Relationships

Enforced by deterministic engines; consumed by construction/management.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (PS-1..4, RS-1, AI-1, DE-1); Architecture V2 §5.6, §6.3; RB-12 · PORT; RB-13 · RISK; P1-08.
