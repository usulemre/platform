# admin-api · routing

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

## Purpose

Define OperationKind, RouteDefinition (with requires_counter_sign), and AdminRouteTree: the technology-independent administrative route hierarchy.

## Responsibilities

Represent admin routes framework-agnostically; default-require authorization; require counter-sign for control-changes (HO-2); bind consequential routes to Tier-5 workflows; hold no logic.

## Relationships

Consumed by each admin controller module (which declares its ROUTES).

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (HO-2, WCON-2, SEC-2, SE-3); Architecture V2 §5.1, §6.2; RB-23 · DOC; Workflow Contracts.
