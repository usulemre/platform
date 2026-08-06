# research-api · routing

> **Phase 3.6 Research API — application interface, contracts & interfaces only.** Technology-
> independent, stateless, secure, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no research implementation, no infrastructure. Delegates to
> application services; exposes no internal domain models.

## Purpose

Define OperationKind, RouteDefinition, and ApiRouteTree: the technology-independent route hierarchy.

## Responsibilities

Represent routes framework-agnostically (operation kind, not HTTP verb); bind consequential routes to Tier-5 workflows; default-require authorization; hold no logic.

## Relationships

Consumed by each domain controller module (which declares its ROUTES).

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (WCON-2, SEC-2, SE-3); Architecture V2 §5.4, §5.9; RB-23 · DOC; Workflow Contracts.
