# execution-service · errors

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define the Execution Engine errors: UnauthorizedExecution, AIExecutionAttempt, OrderSubmissionAttempt, BrokerCommunicationAttempt, ExchangeConnectivityAttempt, ParityBreach, IrreversibleDeployment, MissingRiskAuthority, IllegalExecutionTransition.

## Responsibilities

Express violated execution invariants (token-gated, no AI, plans-only, no broker/exchange, parity, reversibility, risk-authority, lifecycle) as errors.

## Relationships

Used across the Execution Engine modules.

## Dependencies

core_domain.shared (DomainError); aligns with core_domain.execution errors.

## Related Governance Documents

CLAUDE.md (RS-4, AI-1, DEP-3, P3-15, FB-1/12); Architecture V2 §5.9, §6.3; RB-14 · EXEC; RB-30 · DEPLOY; P3-15.
