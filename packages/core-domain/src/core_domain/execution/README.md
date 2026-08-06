# core-domain · Execution domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model paper-first, token-gated, deterministic execution: orders, authorization tokens, parity, fills, position ledger, and reconciliation.

## Responsibilities

Model execution mode (paper default), the time-boxed authorization token, parity reports, and the position ledger.

## Boundaries

Execution is deterministic and paper by default; live requires a valid token; the same engine runs backtest/paper/live differing only by injected clock and adapter.

## Relationships

Consumes Portfolio; gated by Risk (halt) and Governance (authorization token); feeds Monitoring. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

OrderRepository (append-only); ExecutionAuthority, ParityHarness, ReconciliationService (interfaces); events ExecutionAuthorized, FillRecorded, ParityBreachDetected.

## Forbidden Responsibilities

MUST NOT execute without authorization; MUST NOT let AI decide/authorize execution; MUST NOT deploy irreversibly.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (RS-4, DEP-1..4, AI-1); Architecture V2 §5.9, §6.3; RB-14 · EXEC; Execution Governance; P3-15.
