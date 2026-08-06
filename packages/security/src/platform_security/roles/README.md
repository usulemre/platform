# security · roles

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define Role, RoleAssignment, and the RoleManagementService interface: role-based authorization.

## Responsibilities

Represent roles (bundling permission sets) and their assignment/revocation; recorded and auditable; hold no logic.

## Relationships

Consumed by authorization/policy_engine; references permission sets.

## Dependencies

platform_contracts.common (Id); standard library.

## Related Governance Documents

CLAUDE.md (SEC-2, CP-7); Architecture V2 §6.5; RB-27 · SEC.
