# research-service · ownership

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define ResearchOwner and the ResearchOwnershipService interface: accountable ownership and its transfer.

## Responsibilities

Represent accountable ownership as data and its transfer as a recorded, interface-only operation; hold no logic.

## Relationships

Consumed by model, metadata, management.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (CP-7, HO-1); Architecture V2 §5.5; RB-02 · RMET.
