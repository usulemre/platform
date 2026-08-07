# ADR-0001 — Deterministic trading-chain composition seam

| Field                      | Value                                            |
| -------------------------- | ------------------------------------------------ |
| Status                     | ACCEPTED                                         |
| Date                       | 2026-08-08                                       |
| Deciders                   | ARB, PE                                          |
| Patch / Phase refs         | Layer 4 (orchestration)                          |
| Supersedes / Superseded-by | —                                                |

## Context

The platform has eleven real deterministic engines (as-of gateway, validation pipeline, trial
ledger, scientific gate, multiple-testing budget, signal lifecycle, portfolio construction, risk
limit, execution authorization, parity harness, position reconciliation). Each is independently
golden-tested but **hermetically isolated**: no composition root, application service, or entrypoint
exists, and no code feeds one engine's output into the next. In particular the
`ExecutionAuthorizationEngine` reads `AuthorizationEvidence(validated, risk_signed_off, parity_clean)`
as bare booleans that nothing produces at runtime, so the platform cannot answer its own quality-bar
questions ("what risk checks were applied?", "why was execution approved/rejected?", "can the whole
decision be reproduced?").

A composition seam is required to run the trading chain end to end. This is a genuine architectural
decision because the seam necessarily depends on engines from several bounded contexts (portfolio,
risk, execution), and the rules on separation of powers (CP-5), no hidden coupling (SE-2), and
"orchestrate, never adjudicate" (WCON-2, DH-7) constrain where and how it may do so.

## Decision

Introduce a dedicated Layer-4 **`trading-orchestration-service`** whose sole responsibility is
composition. It declares explicit `pyproject` dependencies on the engine services it sequences and
imports each engine through its public API. Its `TradingPipeline.run(request)` sequences
portfolio → risk → parity → execution, threading each engine's **immutable output** into the next
input (`RiskDecision.signed_off` → `risk_signed_off`; `ParityResult.within_tolerance` →
`parity_clean`; the constructed `Portfolio` → the subject risk and execution reference). It stops at
the first failing gate (fail closed), reads no wall-clock (the instant is supplied), and always emits
one immutable, content-addressed `TradingDecisionRecord` capturing every stage's decision and reason
codes for audit.

The orchestrator **adjudicates nothing**: every decision remains inside its own engine. It only
sequences engines and hands along their immutable artifacts.

## Alternatives Considered

- **Application layer inside `execution-service`.** Rejected: execution is a bounded context and the
  terminal consumer; importing portfolio/risk/signal engines into it creates cross-context coupling
  (SE-2) and overloads its single responsibility (SE-1).
- **Concrete implementation inside `packages/workflow-engine`.** Rejected for now: that package is
  reserved for a Temporal-backed durable-workflow binding; a synchronous in-process composition seam
  should not pre-empt that infrastructure decision. When durable orchestration is introduced, the
  pipeline logic can be hosted behind the workflow-engine contract without changing the engines.
- **A message-bus / event-driven composition.** Deferred: the bus (event-bus, messaging) is
  interface-only. The immutable-artifact-threading model here is compatible with a future bus
  implementation and does not foreclose it.

## Consequences

- **Positive.** The trading chain runs and is provably wired (integration tests exercise
  Portfolio→Risk→Parity→Execution). Every run yields a reproducible, explainable audit record (CP-7,
  OB-1, EXP-2). Fail-closed behaviour is enforced at every gate (RS-3). Engines remain unchanged and
  independently replaceable (SE-3).
- **Negative / follow-on.** The service depends on four other services; those dependencies must stay
  one-directional (no engine may depend back on the orchestrator). The seam is synchronous and
  in-process; durability, retries, and compensation (WCON-1, RE-1) are **not** yet provided and will
  require the workflow-engine/Temporal binding — tracked as a follow-on obligation.
- **Invariants.** No new adjudication authority is created; separation of powers (CP-5) and the
  no-AI-in-decision-paths rule (AI-1..4) are preserved — the orchestrator holds neither.

## References

CLAUDE.md: CP-5, CP-7, SE-1/2/3, DE-2, RS-3, DH-7, WCON-1/2, OB-1, EXP-2, AI-1. Architecture V2
Layer 4 (orchestration). Rulebooks: `risk_management.md`, `portfolio_construction.md`. ADR
governance: `docs/architecture/adr/adr_governance.md`.
