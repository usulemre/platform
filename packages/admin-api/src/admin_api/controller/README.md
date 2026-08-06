# admin-api · controller

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

## Purpose

Define the Controller marker and the AdminPipeline interface (validate -> authorize -> governance -> workflow -> delegate -> audit -> publish -> respond).

## Responsibilities

Provide the base admin controller contract and the canonical, no-bypass admin pipeline; controllers delegate to administrative application services and hold no business logic; stateless.

## Relationships

Base for every per-domain admin controller; composes validation/authorization/governance/workflow/audit integrations.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (SE-2/3, WCON-2, AV2-25, HO-2, CP-7); Architecture V2 §5.1, §6.2/§6.3, §7; RB-23 · DOC.
