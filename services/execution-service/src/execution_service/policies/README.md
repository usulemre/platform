# execution-service · policies

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionPolicy (versioned) and the deterministic policy interfaces: PaperFirstPolicy, TokenGatedLivePolicy, DeterministicExecutionPolicy, PlansOnlyPolicy, ReversibilityPolicy, KillSwitchPolicy.

## Responsibilities

Express the execution-governance rules (paper-first, token-gated live, deterministic, plans-only, reversible, kill-switch) as interfaces; hold no logic.

## Relationships

Enforced by deterministic engines; consumed by authorization/governance/management.

## Dependencies

core_domain.shared (EntityId, Version); standard library.

## Related Governance Documents

CLAUDE.md (DEP-1..4, RS-3/4, AI-1, DE-1); Architecture V2 §5.9, §6.3; RB-14 · EXEC; RB-30 · DEPLOY.
