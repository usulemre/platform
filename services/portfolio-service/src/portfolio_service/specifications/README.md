# portfolio-service · specifications

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define composable STRUCTURAL portfolio specifications: PortfolioSpecification, ReadyForApprovalSpecification, EligibleConstituentsSpecification.

## Responsibilities

Express reusable, composable structural readiness/eligibility predicates; never compute exposures/weights or decide; hold no logic.

## Relationships

Composed by management/construction; numerical outputs are the deterministic engines'.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (DE-1, PS-1/2, SE-3); Architecture V2 §5.6, §6.3; RB-12 · PORT.
