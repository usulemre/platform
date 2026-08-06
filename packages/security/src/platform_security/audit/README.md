# security · audit

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define SecurityAuditRecord and the SecurityAuditTrail interface: tamper-evident security audit / access logging.

## Responsibilities

Represent security decisions as immutable, hash-chained audit records with access logging; append-only; hold no persistence.

## Relationships

Fed by access_control/authorization; supports exfiltration detection for crown-jewel assets.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (SEC-2/4, CP-7); Architecture V2 §6.5; RB-27 · SEC; P1-09.
