# research-service · policies

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define the deterministic research policy interfaces: ResearchPolicy, RegisterBeforeRunPolicy, PreRegistrationLockPolicy, IsolationBarrierPolicy, NegativeResultsPolicy.

## Responsibilities

Express the scientific-integrity rules (register-before-run, pre-registration lock, isolation barrier, negative-results preservation) as interfaces; hold no logic.

## Relationships

Enforced by deterministic engines; consumed by management.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (SM-1/2/4, AD-3, CP-5, DE-1); Architecture V2 §5.5, §6.1; RB-02 · RMET; P2-07.
