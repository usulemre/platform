# signal-service · governance

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalGovernanceService: deterministic enforcement of signal governance (mandatory Risk approval, net-of-cost, isolation, no portfolio/execution).

## Responsibilities

Check governance compliance deterministically; enforce mandatory Risk approval, net-of-cost, and isolation; hold no logic.

## Relationships

Depends on an approved Risk assessment; consumed by management/approval; enforces the signal boundaries.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RS-1, AD-1/3, PS-1, DE-1); Architecture V2 §5.5, §6.1, §6.3; RB-13 · RISK; RB-09/10 · FAR; P2-07.
