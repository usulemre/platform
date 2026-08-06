# admin-api · incidents

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

## Purpose

Define the IncidentAdminController interface and the incidents admin route hierarchy: the administrative API surface for incidents, delegating to the incidents administrative application service.

## Responsibilities

Expose incidents get/list/administer operations as a controller interface that validates, authorizes, enforces governance (counter-sign for control-changes), triggers workflows (no staged workflow), delegates to the application service, records audit, and returns canonical responses; hold no business logic and expose no domain models.

## Relationships

core (AdminRequest/AdminResponse); routing (RouteDefinition); delegates to the incidents administrative application service; composed via the admin pipeline.

## Dependencies

admin_api.core; admin_api.routing.

## Related Governance Documents

CLAUDE.md (SE-2/3, HO-2, WCON-2, AV2-25, SEC-2, AI-1..4); Architecture V2 §5.1, §6.2/§6.3; RB-23 · DOC; the relevant registry/governance framework.
