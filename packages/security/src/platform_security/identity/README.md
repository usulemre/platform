# security · identity

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define IdentityType (7 types), IdentityIdentifier, Principal, UserIdentity, ServiceIdentity, and AgentIdentity (with a propose/narrate authority ceiling).

## Responsibilities

Provide the canonical principal and identity types for users/agents/services/system; encode human accountability and the AI-agent authority ceiling; hold no protocol.

## Relationships

Consumed by registry, roles, access_control, authentication; reuses the authority spine.

## Dependencies

core_domain.shared (Authority, ActorKind); lifecycle (IdentityStatus).

## Related Governance Documents

CLAUDE.md (SEC-2, AI-1..4, HO-1, AG-1..4); Architecture V2 §5.3, §6.5; RB-27 · SEC; RB-15 · AIGOV; TDR §18.
