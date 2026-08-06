# risk-service · metadata

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskMetadata: the immutable, auditable, provenance-bearing metadata of a risk assessment.

## Responsibilities

Carry risk metadata (identity, description, independent owner, classification, status, provenance, tags) as data; hold no logic.

## Relationships

Consumed by management and repositories.

## Dependencies

core_domain.shared (Provenance); model; classification; status.

## Related Governance Documents

CLAUDE.md (CP-7, RS-2); Architecture V2 §5.7; RB-13 · RISK.
