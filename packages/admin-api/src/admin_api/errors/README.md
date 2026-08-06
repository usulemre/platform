# admin-api · errors

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

## Purpose

Define AdminError and AdminErrorKind: the canonical, technology-independent admin error model.

## Responsibilities

Express admin errors in canonical terms (validation/unauthenticated/forbidden/counter-sign-required/governance-violation/workflow-required/agent-contract-bypass/domain-model-leak/not-found/conflict/internal); leak no internal details; hold no logic.

## Relationships

Used across admin controllers; guards the governance, agent-contract, workflow, and domain-model boundaries.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (SE-2, SEC-2, HO-2/3, WCON-2, AI-1..4); Architecture V2 §5.1, §6.2; RB-23 · DOC.
