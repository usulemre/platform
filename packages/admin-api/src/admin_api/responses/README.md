# admin-api · responses

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

## Purpose

Define the canonical admin responses: AuditResponse, HealthResponse, ConfigurationResponse, PermissionResponse, RoleResponse, RegistryResponse, WorkflowResponse, AgentResponse.

## Responsibilities

Provide the immutable, canonical administrative response shapes (references only, no internal details); the AgentResponse surfaces the authority ceiling; hold no logic.

## Relationships

Returned by the per-domain admin controllers; built on the core envelope.

## Dependencies

core (AdminStatus, ApiMetadata); standard library.

## Related Governance Documents

CLAUDE.md (SE-2, SEC-3, CP-7, AI-1..4); Architecture V2 §5.1, §6.2; RB-23 · DOC.
