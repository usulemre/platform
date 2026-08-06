# risk-service · model

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define the canonical risk models: RiskAssessment (aggregate), RiskIdentifier, RiskProfile, RiskDecision, RiskEvidence (reusing core RiskVerdict; RiskConstraint/RiskLimit).

## Responsibilities

Represent a risk assessment as an immutable, deterministic, independent aggregate that references performance evidence and its subject by identity; hold no numerical logic, no adjudication by AI.

## Relationships

Consumed by every Risk Engine module; references Backtesting evidence by identity; reuses core_domain.risk.

## Dependencies

core_domain.risk (RiskVerdict); core_domain.shared (AggregateRoot, Provenance, Ref, Version); classification; constraints; limits; status.

## Related Governance Documents

CLAUDE.md (RS-1/2, CP-2/5/7, AI-1, EXP-2, NM-2); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03.
