# security · errors

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define SecurityError, SecurityErrorKind, and SecurityFrameworkError: the canonical, vendor-neutral security error model.

## Responsibilities

Express security errors in vendor-neutral terms (unregistered/auth-failed/access-denied/privilege-escalation/agent-authority/ai-authorization/human-override/revoked/expired); leak no provider details; hold no logic.

## Relationships

Used across the security modules.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (SEC-2, AV2-25, AI-1..4, HO-1); Architecture V2 §6.5, §6.3; RB-27 · SEC; RB-15 · AIGOV.
