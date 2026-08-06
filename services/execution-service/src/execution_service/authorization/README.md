# execution-service · authorization

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionAuthorization and ExecutionAuthorizationService: token-gated authorization with kill-switch (reusing core AuthorizationToken/ExecutionMode).

## Responsibilities

Represent governance authorization (LIVE requires a valid time-boxed token + counter-sign; PAPER default); expose authorize/revoke/kill-switch; no AI authorizes; hold no logic.

## Relationships

core_domain.execution (AuthorizationToken, ExecutionMode); core_domain.shared (EntityId); requires risk sign-off + parity.

## Dependencies

Consumed by lifecycle/management/governance; the kill-switch forces HALT.

## Related Governance Documents

CLAUDE.md (RS-4, RS-3, DEP-1, AI-1, HO-2); Architecture V2 §5.9, §6.3, §7.2; RB-14 · EXEC; RB-13 · RISK.
