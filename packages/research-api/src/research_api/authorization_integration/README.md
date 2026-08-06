# research-api · authorization_integration

> **Phase 3.6 Research API — application interface, contracts & interfaces only.** Technology-
> independent, stateless, secure, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no research implementation, no infrastructure. Delegates to
> application services; exposes no internal domain models.

## Purpose

Define ApiAuthorizationGuard: the mandatory API authorization interface using the Auth & Authz Foundation.

## Responsibilities

Authorize every API request (default-deny, least-privilege) before processing; never bypass authorization; deterministic, never AI-policed; hold no logic.

## Relationships

Uses platform_security; second stage of the API pipeline; feeds the audit trail.

## Dependencies

platform_security.authorization (AuthorizationRequest, AuthorizationResult).

## Related Governance Documents

CLAUDE.md (SEC-2, AV2-25, AI-4, HO-1); Architecture V2 §6.3, §6.5; RB-27 · SEC; Auth & Authz Foundation.
