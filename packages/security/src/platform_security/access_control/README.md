# security · access_control

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define AccessEffect, AccessDecision, and the AccessControl interface: deterministic, default-deny access control.

## Responsibilities

Express deterministic, default-deny, least-privilege access decisions (explainable); enforcement is deterministic and never AI-policed; hold no logic.

## Relationships

Consumed by services/engines; uses roles/permissions; feeds audit.

## Dependencies

platform_contracts.common (Id); standard library.

## Related Governance Documents

CLAUDE.md (SEC-2, AV2-25, EXP-2); Architecture V2 §6.5, §6.3; RB-27 · SEC.
