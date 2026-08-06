# research-api · controller

> **Phase 3.6 Research API — application interface, contracts & interfaces only.** Technology-
> independent, stateless, secure, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no research implementation, no infrastructure. Delegates to
> application services; exposes no internal domain models.

## Purpose

Define the Controller marker and the ApiPipeline interface (validate -> authorize -> workflow -> delegate -> publish -> respond).

## Responsibilities

Provide the base controller contract and the canonical, no-bypass API pipeline; controllers delegate to application services and hold no business logic; stateless.

## Relationships

Base for every per-domain controller; composes the validation/authorization/workflow integrations.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (SE-2/3, WCON-2, AV2-25, SC-4); Architecture V2 §5.9, §6.2/§6.3, §7; RB-23 · DOC.
