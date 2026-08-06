# research-api · errors

> **Phase 3.6 Research API — application interface, contracts & interfaces only.** Technology-
> independent, stateless, secure, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no research implementation, no infrastructure. Delegates to
> application services; exposes no internal domain models.

## Purpose

Define ApiError and ApiErrorKind: the canonical, technology-independent API error model.

## Responsibilities

Express API errors in canonical terms (validation/unauthenticated/forbidden/not-found/conflict/workflow-required/domain-model-leak/rate-limited/internal); leak no internal details; hold no logic.

## Relationships

Used across controllers; DOMAIN_MODEL_LEAK guards the no-domain-model boundary.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (SE-2, SEC-2, WCON-2, CP-7); Architecture V2 §5.9, §6.2; RB-23 · DOC.
