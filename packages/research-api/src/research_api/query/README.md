# research-api · query

> **Phase 3.6 Research API — application interface, contracts & interfaces only.** Technology-
> independent, stateless, secure, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no research implementation, no infrastructure. Delegates to
> application services; exposes no internal domain models.

## Purpose

Define Pagination, Sorting, SortDirection, FilterCriterion, Filtering, and Search: the API query-refinement models.

## Responsibilities

Provide immutable pagination/filtering/sorting/search models for list and search operations; results are access-filtered; hold no logic.

## Relationships

Consumed by controllers for list/search operations.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (SEC-2, SE-2); Architecture V2 §5.9, §6.5; RB-23 · DOC.
