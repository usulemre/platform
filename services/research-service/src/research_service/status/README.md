# research-service · status

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define ResearchStatus: the current lifecycle state plus the supplied time it was entered.

## Responsibilities

Represent research status as an immutable value object; hold no logic.

## Relationships

Consumed by model and metadata.

## Dependencies

lifecycle (ResearchLifecycle); standard library.

## Related Governance Documents

CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.5; RB-02 · RMET.
