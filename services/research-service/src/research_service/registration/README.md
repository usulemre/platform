# research-service · registration

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define ResearchRegistrationService and PreRegistrationService: register-before-run and the one-way pre-registration lock.

## Responsibilities

Express register-before-run and pre-registration (frozen success criteria before evaluation) as interfaces; hold no logic.

## Relationships

Consumed by management; delegates to core_domain.research.PreRegistrationService.

## Dependencies

core_domain.research (PreRegistration); core_domain.shared (EntityId); model.

## Related Governance Documents

CLAUDE.md (SM-1/2, FB-8, EX-1); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance; P3-02.
