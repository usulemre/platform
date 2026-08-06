# security · registry

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define IdentityRegistry: the register-before-use registry of principals.

## Responsibilities

Express register-before-use, append-only, auditable registration/retrieval of principals as an interface; hold no persistence.

## Relationships

Consumed by authentication/authorization; complements the Agent Registry for AI agents.

## Dependencies

platform_contracts.common (Id); identity (Principal); standard library.

## Related Governance Documents

CLAUDE.md (SEC-2, CP-7, REG-1); Architecture V2 §6.5, §5.3; RB-27 · SEC; Agent Registry.
