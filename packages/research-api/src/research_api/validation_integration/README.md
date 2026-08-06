# research-api · validation_integration

> **Phase 3.6 Research API — application interface, contracts & interfaces only.** Technology-
> independent, stateless, secure, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no research implementation, no infrastructure. Delegates to
> application services; exposes no internal domain models.

## Purpose

Define ApiRequestValidator: the mandatory API request-validation interface using the Validation Foundation.

## Responsibilities

Validate every API request structurally via the Validation Foundation before processing; never bypass validation; never statistical; hold no logic.

## Relationships

Uses platform_validation; first stage of the API pipeline.

## Dependencies

platform_validation (ValidationContext, ValidationReport).

## Related Governance Documents

CLAUDE.md (AI-2, DE-4, VS-1); Architecture V2 §5.6, §5.9; RB-04 · VAL; Validation Foundation.
