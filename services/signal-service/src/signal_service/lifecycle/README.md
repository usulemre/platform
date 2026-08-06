# signal-service · lifecycle

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalLifecycle (PROPOSED/GENERATED/VALIDATING/APPROVED/ACTIVE/SUPERSEDED/RETIRED + REJECTED), the canonical transitions (revision/replacement/expiration/revalidation), and the lifecycle-service interface.

## Responsibilities

Enumerate the lifecycle and legal transitions as data; ACTIVE requires validation + mandatory Risk approval; replacement creates new lineage (RL-1); hold no logic.

## Relationships

Consumed by model, status, approval, governance, management, policies.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RS-1, RL-1/2, AD-1, AI-1); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry.
