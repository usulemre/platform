# security · lifecycle

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define IdentityLifecycle (REGISTERED/AUTHENTICATING/AUTHENTICATED/AUTHORIZED/ACTIVE/EXPIRED/REVOKED + SUSPENDED), the canonical transitions, IdentityStatus, and the lifecycle service (renewal/revocation/suspension/delegation).

## Responsibilities

Enumerate the identity/credential lifecycle and legal transitions as data and expose lifecycle operations; hold no authentication protocol; a human decision is never AI-overridden.

## Relationships

Consumed by identity, registry, authentication, events.

## Dependencies

platform_contracts.common (Id); standard library.

## Related Governance Documents

CLAUDE.md (SEC-2, HO-1, CS-3, RL-1); Architecture V2 §6.5; RB-27 · SEC.
