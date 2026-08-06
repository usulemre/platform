# admin-api · validation_integration

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

## Purpose

Define AdminRequestValidator: the mandatory admin request-validation interface using the Validation Foundation.

## Responsibilities

Validate every admin request structurally before processing; never bypass validation; hold no logic.

## Relationships

Uses platform_validation; first stage of the admin pipeline.

## Dependencies

platform_validation (ValidationContext, ValidationReport).

## Related Governance Documents

CLAUDE.md (AI-2, DE-4); Architecture V2 §5.6, §5.1; RB-04 · VAL; Validation Foundation.
