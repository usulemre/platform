# Architecture Map

> **How the repository directories realize Architecture V2.** This map is a _navigation aid_; it
> restates no architecture and no rules — it cites them. Where it and Architecture V2 diverge,
> Architecture V2 governs (AV2-1) and this map is corrected.

- **Authority:** navigational (Tier-6 support). Governed by [Architecture V2](../architecture/architecture_v2.md), [CLAUDE.md](../../CLAUDE.md).
- **Owner:** ARB.

---

## The authority spine (orthogonal to every layer)

```
AI: propose / narrate  ──▶  Deterministic: decide / execute  ──▶  Human: accountable / approve
        agents/ ai-runtime        services/ (engines), packages/            apps/ (approvals),
                                                                            docs/ governance
```

No layer lets AI decide, bypass a deterministic gate, or skip a required human approval
(AV2-14, §6.3).

## The nine layers → repository homes

| #   | Architecture V2 Layer                    | Primary repository home(s)                                                                                                                                                                            | Build phase    |
| --- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | Human Governance (top authority)         | `apps/admin-web/`, `docs/` (governance), `contracts/api/`                                                                                                                                             | 7              |
| 2   | AI Orchestration                         | `packages/ai-runtime/`, `workflows/` (driving)                                                                                                                                                        | 5–6            |
| 3   | Agent Layer                              | `agents/`, `packages/ai-runtime/`                                                                                                                                                                     | 5              |
| 4   | Workflow Control                         | `workflows/`, `packages/workflow-engine/`                                                                                                                                                             | 6              |
| 5   | Research Intelligence                    | `services/research-service/`, `services/feature-service/`, `services/signal-service/`, `services/strategy-service/`, `experiments/`, `features/`, `signals/`, `strategies/`, `packages/research-sdk/` | 3              |
| 6   | Quantitative Engine (deterministic core) | `services/validation-service/`, `services/backtesting-service/`, `services/portfolio-service/`, `portfolios/`                                                                                         | 4              |
| 7   | Risk Management (independent)            | `services/risk-service/`                                                                                                                                                                              | 4 (extended 8) |
| 8   | Data Platform (foundation)               | `services/dataset-service/`, `datasets/`, `packages/data-sdk/`                                                                                                                                        | 2              |
| 9   | Execution                                | `services/execution-service/`, `services/monitoring-service/`, `deployment/`                                                                                                                          | 8              |

## The cross-cutting spines → repository homes

| Spine (Architecture V2 §5.10)              | Repository home(s)                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| Contracts (bounded contexts)               | `contracts/`, `packages/contracts/`, `shared/`                                         |
| Memory Fabric (scoped, isolation-aware)    | `packages/ai-runtime/` (memory), governed by RB-19 · MEM                               |
| Security (threat model, exfil, quarantine) | `packages/security/`, `configs/` (secrets by reference), `infrastructure/identity/`    |
| Reproducibility + Observability + Audit    | `packages/observability/`, `packages/logging/`, `infrastructure/` (run ledger, stores) |

## The five boundaries (Architecture V2 §6) → where enforced

| Boundary                                                      | Enforced by (repository)                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **AI** (propose/narrate; no OOS; isolation)                   | `agents/` contracts, `packages/ai-runtime/`, `infrastructure/bus/` ACLs |
| **Human** (mandatory approvals, counter-sign)                 | `apps/admin-web/`, `workflows/production-deployment/`                   |
| **Deterministic** (significance, risk, allocation, execution) | `services/{validation,risk,portfolio,execution}-service/`               |
| **Data** (As-Of Gateway sole read path; OOS sealed)           | `services/dataset-service/`, `packages/data-sdk/`                       |
| **Security** (crown-jewel exfil, secrets, audit)              | `packages/security/`, `configs/`, `infrastructure/`                     |

## The staged research→production chain (Architecture V2 §7.1)

```
idea → feature (PIT/leakage-clean) → statistical validation → backtest → replication
     → Scientific Gate (token) → risk review → portfolio → human approval → deploy (paper→live)
```

Realized as the seven Tier-5 workflows in [`workflows/`](../../workflows/) (WFC-43..49), gated by
the **First-Capital Gate** (after Phase 4) and the **Live-Capital Gate** (after Phase 8), which
are hard milestones — no capital flows before its gate is green (IMP-29).

## Reading order for a new engineer

1. [`CLAUDE.md`](../../CLAUDE.md) → 2. [Architecture V2](../architecture/architecture_v2.md) →
2. [Architecture Review](../architecture/architecture_review.md) (why the invariants exist) →
3. [Architecture Patch Plan](../architecture/architecture_patch_plan.md) (the enforcement sequence) →
4. [Implementation Roadmap](../implementation/implementation_roadmap.md) (the build order) →
5. the relevant Rulebook / Registry / Contract for the module you are building.
