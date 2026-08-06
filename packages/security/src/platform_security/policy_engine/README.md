# security · policy_engine

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define SecurityPolicy (versioned) and the PolicyEngine interface: deterministic authorization-policy evaluation.

## Responsibilities

Represent versioned RBAC/ABAC policies and expose deterministic, golden-testable evaluation; no AI evaluates policy; hold no logic.

## Relationships

Consumed by authorization; the concrete engine (OPA) plugs in behind the interface.

## Dependencies

platform_contracts.common (SchemaVersion); authorization (AuthorizationRequest, AuthorizationResult).

## Related Governance Documents

CLAUDE.md (AV2-25, DE-1/2, VER-1, SEC-2); Architecture V2 §6.5, §6.3; RB-27 · SEC; TDR §18.
