# backtesting-service · lifecycle

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define BacktestLifecycle (PROPOSED/CONFIGURED/READY/RUNNING/VALIDATING/COMPLETED/APPROVED/ARCHIVED + SUSPENDED/CANCELLED), the canonical transitions (revision/resume/revalidation/cancellation), and the lifecycle-service interface.

## Responsibilities

Enumerate the lifecycle and legal transitions as data; replay reproduces a run as new lineage (RL-1); hold no logic.

## Relationships

Consumed by model, status, engine, session, policies.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RL-1, BT-3, CP-5); Architecture V2 §5.6; RB-11 · BT.
