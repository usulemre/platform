# Governance Index

> The single index of the governance corpus that binds this repository, in tier order. This index
> **points to** the authoritative documents; it restates none of them (DOC-1). Every module in the
> repository must trace to its governing documents (IMP-1, IMP-27).

- **Owner:** ARB / GRC. **Governed by:** [CLAUDE.md](../../CLAUDE.md) (Table of Authority).

## Table of Authority (a lower tier MUST NOT contradict a higher tier)

| Tier                       | Documents                                                                                                                                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 · Constitution**       | [`CLAUDE.md`](../../CLAUDE.md) — supreme; entrenched clauses CP-1..8, AI-1..8, FB-1..14                                                                                                                                                  |
| **2 · Architecture Canon** | [ARCH (V1)](../architecture/hedgefund-research-os-architecture.md) · [REVIEW](../architecture/architecture_review.md) · [PATCH PLAN](../architecture/architecture_patch_plan.md) · [Architecture V2](../architecture/architecture_v2.md) |
| **3 · Rulebooks**          | [Rulebook Framework](../rulebooks/rulebook_framework.md) + the rulebooks below                                                                                                                                                           |
| **4 · Agent Contracts**    | [`agent_contracts.md`](../contracts/agent_contracts.md) (Tier-4)                                                                                                                                                                         |
| **5 · Workflow Contracts** | [`workflow_contracts.md`](../contracts/workflow_contracts.md) (Tier-5)                                                                                                                                                                   |
| **6 · Source Code**        | this repository (lowest authority)                                                                                                                                                                                                       |

## Rulebooks (Tier 3)

| Ref             | Rulebook               | Document                                                                      |
| --------------- | ---------------------- | ----------------------------------------------------------------------------- |
| RB-01 · STAT    | Statistics             | [rulebooks/statistics.md](../rulebooks/statistics.md)                         |
| RB-02 · RMET    | Research Methodology   | [rulebooks/research_methodology.md](../rulebooks/research_methodology.md)     |
| RB-06/07 · DATA | Data Quality           | [rulebooks/data_quality.md](../rulebooks/data_quality.md)                     |
| RB-09/10 · FAR  | Factor Research        | [rulebooks/factor_research.md](../rulebooks/factor_research.md)               |
| RB-11 · BT      | Backtesting            | [rulebooks/backtesting.md](../rulebooks/backtesting.md)                       |
| RB-12 · PORT    | Portfolio Construction | [rulebooks/portfolio_construction.md](../rulebooks/portfolio_construction.md) |
| RB-13 · RISK    | Risk Management        | [rulebooks/risk_management.md](../rulebooks/risk_management.md)               |
| RB-15 · AIGOV   | AI Governance          | [rulebooks/ai_governance.md](../rulebooks/ai_governance.md)                   |
| RB-20 · CODE    | Coding Standards       | [standards/coding_standards.md](../standards/coding_standards.md)             |

> Forthcoming rulebooks referenced by the canon (VAL, PIT, EXEC, DEPLOY, MODEL, PROMPT, AGENT,
> MEM, SEC, OBS, PERF, TEST, DOC, GIT, ADR, NAME) are cited by their `RB-nn` ids until ratified;
> unresolved citations block dependent work (per the Constitution's citation rule).

## Registries (operational governance)

| Registry            | Document                                                                                    | Governs (repository home) |
| ------------------- | ------------------------------------------------------------------------------------------- | ------------------------- |
| Agent Registry      | [registry/agent_registry.md](../registry/agent_registry.md)                                 | `agents/`                 |
| Portfolio Registry  | [registry/portfolio_registry.md](../registry/portfolio_registry.md)                         | `portfolios/`             |
| Dataset Governance  | [data/dataset_governance.md](../data/dataset_governance.md)                                 | `datasets/`               |
| Feature Registry    | [research/feature_registry.md](../research/feature_registry.md)                             | `features/`               |
| Signal Registry     | [research/signal_registry.md](../research/signal_registry.md)                               | `signals/`                |
| Strategy Registry   | [research/strategy_registry.md](../research/strategy_registry.md)                           | `strategies/`             |
| Experiment Tracking | [research/experiment_tracking_governance.md](../research/experiment_tracking_governance.md) | `experiments/`            |

## Operational & evaluation frameworks

| Framework             | Document                                                                                      | Repository home                                        |
| --------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Execution Governance  | [operations/execution_governance.md](../operations/execution_governance.md)                   | `services/execution-service/`, `deployment/`           |
| Production Monitoring | [operations/production_monitoring.md](../operations/production_monitoring.md)                 | `services/monitoring-service/`, `apps/monitoring-web/` |
| Incident Response     | [operations/incident_response_governance.md](../operations/incident_response_governance.md)   | `services/monitoring-service/`                         |
| Disaster Recovery     | [operations/disaster_recovery_governance.md](../operations/disaster_recovery_governance.md)   | `deployment/`, `infrastructure/`                       |
| AI Agent Evaluation   | [evaluation/ai_agent_evaluation_framework.md](../evaluation/ai_agent_evaluation_framework.md) | `agents/`, `packages/ai-runtime/`                      |
| ADR Governance        | [architecture/adr/adr_governance.md](../architecture/adr/adr_governance.md)                   | [`docs/adr/`](../adr/)                                 |

## Build & change governance

- **Build sequence:** [Implementation Roadmap](../implementation/implementation_roadmap.md) (Phases 0–8, gates, deliverable registry).
- **Correctness sequence:** [Architecture Patch Plan](../architecture/architecture_patch_plan.md) (patches `P1`–`P6`, release gates §5).
- **Decisions:** [`docs/adr/`](../adr/) — every non-obvious correctness/architecture/validity decision (DOC-2).

## The entrenched, non-waivable core

These may only be strengthened, never weakened (AM-2): **CP-1..8**, **AI-1..8**, **FB-1..14**, the
two **release gates** (IMP-29), and the **hard quality gates** (Deterministic / Statistical /
Reproducibility, IMP-26). No exception or waiver may touch them (IMP-W-1).
