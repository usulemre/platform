# signal-service · policies

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define the deterministic signal policy interfaces: SignalPolicy, DeterministicDecisionPolicy, NetOfCostPolicy, MandatoryRiskApprovalPolicy, IsolationBarrierPolicy, NoPortfolioConstructionPolicy, NoExecutionAuthorityPolicy.

## Responsibilities

Express the signal-governance rules (deterministic decisions, net-of-cost, mandatory Risk approval, isolation, no portfolio/execution) as interfaces; hold no logic.

## Relationships

Enforced by deterministic engines; consumed by governance/management.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (DE-1, AI-1, AD-1/3, RS-1, PS-1); Architecture V2 §5.5, §6.1, §6.3; RB-09/10 · FAR; RB-13 · RISK; P2-07.
