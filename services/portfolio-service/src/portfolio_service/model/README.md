# portfolio-service · model

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define the canonical portfolio models: Portfolio (aggregate), PortfolioCandidate, PortfolioIdentifier, PortfolioEvidence, PortfolioSummary, PortfolioDecision (reusing core PortfolioRationale).

## Responsibilities

Represent a portfolio as an immutable, content-addressed snapshot with rationale that references eligible signals and risk by identity; hold no optimization algorithm, no execution, no AI decision.

## Relationships

Consumed by every Portfolio Engine module; references Signal/Risk by identity; reuses core_domain.portfolio.

## Dependencies

core_domain.portfolio (PortfolioRationale); core_domain.shared (AggregateRoot, ContentAddress, Provenance, Ref, Version); allocation; status.

## Related Governance Documents

CLAUDE.md (PS-1..4, CP-2/5/7, AI-1, NM-2); Architecture V2 §5.6, §6.3; RB-12 · PORT; Portfolio Registry; P1-08.
