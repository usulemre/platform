# research-api · backtests

> **Phase 3.6 Research API — application interface, contracts & interfaces only.** Technology-
> independent, stateless, secure, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no research implementation, no infrastructure. Delegates to
> application services; exposes no internal domain models.

## Purpose

Define the BacktestController interface and the backtests route hierarchy: the API surface for backtests operations, delegating to the backtests application service.

## Responsibilities

Expose backtests create/get/list/action operations as a controller interface that validates, authorizes, triggers workflows (Tier-5 workflow WFC-45), delegates to the application service, and returns canonical responses; hold no business logic and expose no domain models.

## Relationships

core (ApiRequest/ApiResponse); routing (RouteDefinition); delegates to the backtests application service; composed via the API pipeline.

## Dependencies

research_api.core; research_api.routing.

## Related Governance Documents

CLAUDE.md (SE-2/3, WCON-2, AV2-25, SEC-2); Architecture V2 §5.9, §6.2/§6.3; RB-23 · DOC; the backtests service and its registry/governance.
