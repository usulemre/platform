# security · permissions

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define Permission, PermissionEffect, and PermissionSet: least-privilege permissions and their sets.

## Responsibilities

Represent least-privilege permissions (resource + action + effect) and bundles; default-deny beyond granted; hold no logic.

## Relationships

Consumed by roles, access_control, authorization.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (SEC-2, AV2-25); Architecture V2 §6.5; RB-27 · SEC.
