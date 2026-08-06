# services/ — Domain Services

> **Phase 0 scaffolding placeholder.** Structure only — no business logic.

## Purpose

Bounded-context backend services, each realizing one Architecture V2 layer/component behind a
stable service contract. Services own their contracts and are independently buildable,
testable, and replaceable (SE-3, AV2-8).

## Scope

One service per bounded context. Consequential quantitative decisions live only in the
deterministic engines (validation, risk, portfolio, backtest, execution); research/data
services propose and serve, they never adjudicate.

## Members

Research · Dataset · Feature · Signal · Strategy · Portfolio · Backtesting · Validation ·
Risk · Execution · Monitoring. See each service's README for owner, layer, and build phase.

## Allowed Contents

Service contract skeletons; API/interface placeholders; module documentation.

## Forbidden Contents

Business logic or algorithms in Phase 0; asset-class branching in a core service (CP-8);
data reads outside the As-Of Gateway (PIT-1); any LLM in a decision/execution path (AI-1);
hidden cross-service coupling (SE-2).

## Ownership

Per-service domain leads (see each README). Architecture owner: ARB.

## Dependencies

Services depend downward per the Architecture V2 topology and only via contracts
(Contracts Spine, AV2-13). The build order is data → research → feature → signal → strategy →
portfolio → execution → monitoring, with the deterministic engines gating acceptance (IMP-21).

## Related Governance Documents

CLAUDE.md; Architecture V2 §5; the six Registries; Rulebooks; Implementation Roadmap Part C/D.
