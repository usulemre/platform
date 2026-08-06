# security · context

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define SecurityContext: the immutable per-request security context (principal, actor with authority, correlation).

## Responsibilities

Carry the authenticated principal/actor and correlation for traceability; carry no credentials; hold no logic.

## Relationships

Consumed by authorization and audit; correlates every security decision.

## Dependencies

core_domain.shared (ActorRef); platform_contracts.common (CorrelationId).

## Related Governance Documents

CLAUDE.md (SEC-3, CP-7, CS-3); Architecture V2 §6.5; RB-27 · SEC.
