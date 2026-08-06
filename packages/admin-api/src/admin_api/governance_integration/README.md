# admin-api · governance_integration

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

## Purpose

Define GovernanceGuard: the mandatory admin governance-enforcement interface (approval + counter-sign).

## Responsibilities

Enforce governance rules on administrative operations; require human approval + independent counter-sign for control-changes (HO-2); never let an override bypass a hard control (HO-3); no AI approves; hold no logic.

## Relationships

Third stage of the admin pipeline; consumed by controllers; relates to the Governance domain.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (HO-1/2/3, AI-3, CP-5, RG-3); Architecture V2 §5.1, §6.2; RB-13 · RISK; ADR Governance.
