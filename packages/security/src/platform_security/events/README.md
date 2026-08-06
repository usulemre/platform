# security · events

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define the canonical security domain events: IdentityRegistered, AuthenticationRequested, AuthenticationSucceeded, AuthenticationFailed, AuthorizationGranted, AuthorizationDenied, RoleAssigned, PermissionGranted, PermissionRevoked, IdentityRevoked.

## Responsibilities

Represent identity/auth facts as immutable domain events carrying the domain event envelope; records, not commands.

## Relationships

core_domain.shared (DomainEvent, EntityId); flow on the Event Bus and into the audit trail.

## Dependencies

core_domain.shared (DomainEvent, EntityId).

## Related Governance Documents

CLAUDE.md (SEC-2/4, CP-2/7); Architecture V2 §6.5, §5.10; RB-27 · SEC; Event Bus.
