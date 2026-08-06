# workflows/ — Workflow Definitions (Tier-5, orchestration)

> **Phase 0 scaffolding placeholder.** Structure only — the workflow engine lands in **Phase 6**.

## Purpose

Home for the platform's durable, versioned **workflow definitions** that sequence and gate the
work of agents, deterministic engines, and humans. A workflow **orchestrates; it never
adjudicates** — every gate delegates to its owning deterministic engine or human approver
(WCON-2, AV2-18).

## Scope

Workflow definitions realizing the ratified Tier-5 **Workflow Contracts** (`docs/contracts/
workflow_contracts.md`). The seven staged workflows chain in order and are gated by the
First-Capital and Live-Capital Gates.

## Members

research-discovery (WFC-43) · feature-research (WFC-44) · backtesting (WFC-45) ·
validation (WFC-46) · risk-review (WFC-47) · portfolio-construction (WFC-48) ·
production-deployment (WFC-49).

## Allowed Contents

Versioned workflow definition skeletons; state/transition/gate placeholders; documentation.

## Forbidden Contents

Decision logic embedded in a workflow (WCON-2); undeclared transitions or stage-skipping
(WFC-16); research moved directly to production (WFC-3); any AI approving its own output.

## Ownership

Accountable role: HSRE (workflow engine); per-workflow gate owners per the Workflow Contracts.

## Dependencies

Depends on `packages/workflow-engine`, the deterministic engines (gates), and the agents it
coordinates — all via contracts. Built after Phases 1, 4, 5.

## Related Governance Documents

CLAUDE.md (WCON-1..3); Architecture V2 §5.4; Workflow Contracts (Tier-5); Implementation
Roadmap Phase 6.
