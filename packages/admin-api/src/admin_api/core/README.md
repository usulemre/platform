# admin-api · core

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

## Purpose

Define the canonical Admin API envelope models: ApiVersion, ResourceIdentifier, ApiMetadata, AdminStatus (incl. PENDING_COUNTER_SIGN), AdminRequest, AdminResponse, ErrorResponse.

## Responsibilities

Provide the immutable, generic administrative request/response/error envelope carrying admin DTOs (never domain models); model the counter-sign-pending status; hold no logic.

## Relationships

Consumed by every controller, response, and integration module; ApiMetadata references the administrator's security context.

## Dependencies

platform_contracts.common (CorrelationId); standard library.

## Related Governance Documents

CLAUDE.md (SE-2, CP-7, SEC-3, HO-2, VER-1, CS-3); Architecture V2 §5.1, §6.2; RB-23 · DOC.
