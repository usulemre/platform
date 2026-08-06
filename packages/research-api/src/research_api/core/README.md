# research-api · core

> **Phase 3.6 Research API — application interface, contracts & interfaces only.** Technology-
> independent, stateless, secure, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no research implementation, no infrastructure. Delegates to
> application services; exposes no internal domain models.

## Purpose

Define the canonical API envelope models: ApiVersion, ResourceIdentifier, ApiMetadata, ApiRequest, ApiResponse, ApiStatus, ErrorResponse.

## Responsibilities

Provide the immutable, generic request/response/error envelope carrying API DTOs (never domain models); hold no logic.

## Relationships

Consumed by every controller and integration module; ApiMetadata references the security context.

## Dependencies

platform_contracts.common (CorrelationId); standard library.

## Related Governance Documents

CLAUDE.md (SE-2, CP-7, SEC-3, VER-1, CS-3); Architecture V2 §5.9, §6.2; RB-23 · DOC; TDR §11.
