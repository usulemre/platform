# Module Index

> The deliverable registry view of the repository: every module, its owner, its architectural
> home, its build phase, and its governing documents (IMP-27 — _unregistered deliverables MUST NOT
> be built_). This index is the build's map; the authoritative live registry is maintained by the
> Implementation Roadmap (Part G).

- **Owner:** ARB / PE. **Governed by:** [Implementation Roadmap](../implementation/implementation_roadmap.md) Part G, IMP-27.

## Legend

- **Phase** — the [Implementation Roadmap](../implementation/implementation_roadmap.md) build phase (0–8).
- **Authority** — `decide` (deterministic engine), `narrate`/`propose` (AI), `approve` (human), `serve`/`orchestrate` (support).
- No module marked `decide` may be an AI/LLM (AV2-27); no module ships to capital before its release gate (IMP-29).

## Foundation (Phase 0 — this deliverable)

| Module                          | Home                 | Owner   | Governance                    |
| ------------------------------- | -------------------- | ------- | ----------------------------- |
| Repository scaffolding          | (whole repo)         | PE      | Roadmap Phase 0; RB-26 · NAME |
| Contract registry skeleton      | `contracts/`         | ARB     | IMP-10; P5-02                 |
| Config / environment separation | `configs/`           | PE/HSRE | SEC-3; CODE-29                |
| ADR repository                  | `docs/adr/`          | ARB     | ADR-1..4                      |
| CI governance-gate descriptions | `tools/ci/`          | PE      | Roadmap Part E/F              |
| Scaffolding generator           | `tools/scaffolding/` | PE      | IMP-7, IMP-17                 |

## Core platform (Phase 1)

| Module                             | Home                                         | Authority | Owner   | Governance       |
| ---------------------------------- | -------------------------------------------- | --------- | ------- | ---------------- |
| Clock + reproducibility spine      | `packages/observability/`, `infrastructure/` | serve     | PE/HSRE | RB-05; P1-02/03  |
| Artifact registry + bus + identity | `infrastructure/`                            | serve     | HSRE    | ARCH §2.1; P5-04 |
| Domain model / shared kernel       | `packages/core-domain/`, `shared/`           | serve     | ARB/PE  | CP-8; P1-07      |
| Security / secrets broker          | `packages/security/`, `configs/`             | serve     | CISO    | P1-09; P4-03     |

## Data platform (Phase 2)

| Module                                        | Home                                              | Authority            | Owner | Governance                          |
| --------------------------------------------- | ------------------------------------------------- | -------------------- | ----- | ----------------------------------- |
| As-Of Gateway + vintage store                 | `services/dataset-service/`, `packages/data-sdk/` | decide (fail-closed) | HD    | RB-08 · PIT; P1-01                  |
| Ingestion + certification + lineage           | `services/dataset-service/`, `datasets/`          | serve                | HD    | RB-06/07 · DATA; Dataset Governance |
| Feature Factory (data side) + Leakage Harness | `services/feature-service/`, `features/`          | decide (gate)        | HD/HQ | P1-06; P2-03                        |

## Research platform (Phase 3)

| Module                          | Home                                         | Authority     | Owner  | Governance                        |
| ------------------------------- | -------------------------------------------- | ------------- | ------ | --------------------------------- |
| Research lifecycle + registries | `services/research-service/`, `experiments/` | propose/serve | HQ     | RB-02 · RMET; Experiment Tracking |
| Feature Registry / Marketplace  | `services/feature-service/`, `features/`     | serve         | HD/HQ  | Feature Registry                  |
| Signal lifecycle                | `services/signal-service/`, `signals/`       | propose/serve | HQ     | Signal Registry                   |
| Strategy lifecycle              | `services/strategy-service/`, `strategies/`  | propose/serve | HQ/HPR | Strategy Registry                 |

## Quantitative engines — the deterministic core (Phase 4 · First-Capital Gate)

| Module                                                        | Home                                           | Authority | Owner  | Governance                  |
| ------------------------------------------------------------- | ---------------------------------------------- | --------- | ------ | --------------------------- |
| Trial Ledger + Multiple-Testing Enforcer                      | `services/validation-service/`, `experiments/` | decide    | GRC/HR | RB-01 · STAT; P2-01/02      |
| Validation gauntlet / holdout / replication / scientific gate | `services/validation-service/`                 | decide    | GRC    | RB-04 · VAL; P2-05/06/08/09 |
| Backtest engine                                               | `services/backtesting-service/`                | decide    | HQ     | RB-11 · BT; P3-16           |
| Risk limit engine + kill-switch                               | `services/risk-service/`                       | decide    | HPR    | RB-13 · RISK; P1-03         |
| Portfolio optimizer                                           | `services/portfolio-service/`, `portfolios/`   | decide    | HPR    | RB-12 · PORT; P1-08         |

## AI platform (Phase 5 — advisory only)

| Module                                        | Home                                         | Authority       | Owner        | Governance                                     |
| --------------------------------------------- | -------------------------------------------- | --------------- | ------------ | ---------------------------------------------- |
| Agent runtime + Model/Agent registries + eval | `packages/ai-runtime/`, `agents/`            | propose/narrate | HAI/MRC      | RB-15 · AIGOV; Agent Registry; Eval; P4-01..07 |
| Trust / quarantine layer                      | `packages/security/`, `packages/ai-runtime/` | serve           | CISO/HAI     | P4-03                                          |
| Registered agents (13, per Agent Registry)    | `agents/`                                    | propose/narrate | per registry | Agent Contracts; P2-07                         |

## Orchestration (Phase 6)

| Module                              | Home                                      | Authority       | Owner | Governance                |
| ----------------------------------- | ----------------------------------------- | --------------- | ----- | ------------------------- |
| Workflow engine + saga + run ledger | `packages/workflow-engine/`, `workflows/` | orchestrate     | HSRE  | Workflow Contracts; P5-05 |
| Approval / tiered-autonomy engine   | `workflows/`, `apps/admin-web/`           | approve (human) | GRC   | HO-2; P5-05               |

## User applications (Phase 7)

| Module                                          | Home    | Authority     | Owner  | Governance      |
| ----------------------------------------------- | ------- | ------------- | ------ | --------------- |
| Research / Admin / Monitoring UIs · Docs portal | `apps/` | approve/serve | PE/GRC | AV2 §6.2; RB-23 |

## Production platform (Phase 8 · Live-Capital Gate)

| Module                                     | Home                                                             | Authority            | Owner    | Governance                                |
| ------------------------------------------ | ---------------------------------------------------------------- | -------------------- | -------- | ----------------------------------------- |
| Execution engine + parity + reconciliation | `services/execution-service/`, `deployment/`                     | decide (token-gated) | HPR/HSRE | RB-14 · EXEC; Execution Governance; P3-15 |
| Production monitoring + incident + DR/BCP  | `services/monitoring-service/`, `infrastructure/`, `deployment/` | serve/narrate        | HSRE     | Monitoring/Incident/DR Governance; P6-03  |

## Registered AI agents (Phase 5 roster — see [Agent Registry](../registry/agent_registry.md))

| ID              | Name                                                                           | Authority | Home                          |
| --------------- | ------------------------------------------------------------------------------ | --------- | ----------------------------- |
| AGT-RD-001..004 | Research Discovery / Literature Miner / Company Researcher / Research Director | propose   | `agents/research-discovery/`  |
| AGT-FD-001/002  | Feature Engineering / Factor Search                                            | propose   | `agents/feature-discovery/`   |
| AGT-AN-001      | Backtesting Agent                                                              | propose   | `agents/analysis/`            |
| AGT-VN-001      | Validation Narrator                                                            | narrate   | `agents/validation-narrator/` |
| AGT-RN-001      | Risk Analysis Agent                                                            | narrate   | `agents/risk-narrator/`       |
| AGT-PN-001      | Portfolio Analysis Agent                                                       | narrate   | `agents/portfolio-narrator/`  |
| AGT-DO-001      | Documentation Agent                                                            | propose   | `agents/documentation/`       |
| AGT-EN-001      | Engineering Agent                                                              | propose   | `agents/engineering/`         |
| AGT-MO-001      | Monitoring Narrator                                                            | narrate   | `agents/monitoring-narrator/` |

Every agent is `propose`/`narrate` only — none holds `decide` authority (REG-9, AV2-17).
