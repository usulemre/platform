# admin-api · audit_integration

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

## Purpose

Define AdminAuditSink: the mandatory admin audit-sink interface using the tamper-evident security audit trail.

## Responsibilities

Record every consequential admin operation (who/what/when/why, incl. overrides/counter-signs) in the tamper-evident audit trail; never bypass audit; hold no logic.

## Relationships

Uses platform_security.audit; sixth stage of the admin pipeline.

## Dependencies

platform_security.audit (SecurityAuditRecord).

## Related Governance Documents

CLAUDE.md (CP-7, SEC-4, HO-2, OB-1); Architecture V2 §5.10, §6.5; RB-27 · SEC; P1-09.
