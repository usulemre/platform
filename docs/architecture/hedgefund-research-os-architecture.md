# AI Hedge Fund Research Operating System

## Architecture Design Document v1.0

> **Scope of this document:** system architecture only. No implementation code. This is the blueprint a founding engineering team would work from for 12–24 months.

---

## 0. Design Philosophy (Read This First)

Before folders, the governing principles. Every decision below descends from these. If a future change violates one of these, the change is wrong.

**1. This is a research OS, not a strategy.**
A trading bot encodes _one_ opinion about markets. A research OS is a _factory that produces, tests, and retires opinions_. The unit of value is not a trade — it is a **validated hypothesis** and the **evidence trail** behind it. The system's output is knowledge; execution is a downstream consumer of that knowledge.

**2. Separation of alpha discovery from alpha capture.**
Renaissance's structural insight: the process that _finds_ signal must be firewalled from the process that _acts_ on it. Discovery optimizes for statistical truth; capture optimizes for cost, risk, and capacity. Coupling them corrupts both.

**3. Everything is a versioned, immutable artifact.**
Data snapshots, factor definitions, hypotheses, backtests, portfolios, model weights — all are content-addressed and immutable. You never mutate a backtest; you produce a new one. This is the only way to achieve reproducibility, which is the only way to trust a result 18 months later. **Reproducibility is a non-negotiable, not a feature.**

**4. Point-in-time correctness is sacred.**
The single most common way institutional research dies is lookahead bias and survivorship bias. The architecture must make it _structurally difficult_ to see data that did not exist at the decision moment. This is enforced at the data-layer boundary, not left to discipline.

**5. One agent, one responsibility.**
Per your requirement. An agent is a narrow, auditable, replaceable worker. Agents do not share mutable state. They communicate through a message bus and read/write immutable artifacts. No agent may both generate a hypothesis and judge it — the conflict of interest destroys statistical validity.

**6. The adversary is yourself.**
The biggest enemy is overfitting and multiple-hypothesis testing. Entire subsystems exist purely to _attack_ the fund's own ideas: a validation gauntlet, a deflation engine for p-values, an out-of-sample vault the research side cannot touch. Skepticism is institutionalized in code, not culture.

**7. Asset-class agnostic core, asset-class specific edges.**
The core (hypothesis lifecycle, backtest engine, portfolio math) knows nothing about "stocks" vs "crypto." Asset specifics live in pluggable adapters at the edges. Adding Turkish equities or options must never require touching the core.

---

## 1. High-Level System Topology

The system is composed of **nine horizontal layers** and a **cross-cutting agent mesh**. Data and control flow vertically; agents observe and act across layers.

```
┌───────────────────────────────────────────────────────────────────────┐
│  LAYER 9 — GOVERNANCE, RISK & COMPLIANCE (oversight, kill-switches)     │
├───────────────────────────────────────────────────────────────────────┤
│  LAYER 8 — EXECUTION & PORTFOLIO OPERATIONS (paper → live)             │
├───────────────────────────────────────────────────────────────────────┤
│  LAYER 7 — PORTFOLIO CONSTRUCTION (optimization, risk budgeting)        │
├───────────────────────────────────────────────────────────────────────┤
│  LAYER 6 — BACKTESTING & SIMULATION (institutional-grade)              │
├───────────────────────────────────────────────────────────────────────┤
│  LAYER 5 — VALIDATION & STATISTICAL DEFENSE (the adversary)           │
├───────────────────────────────────────────────────────────────────────┤
│  LAYER 4 — FACTOR & SIGNAL ENGINEERING (alpha production)             │
├───────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — RESEARCH & HYPOTHESIS ENGINE (the brain)                   │
├───────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — FEATURE & DATA SEMANTIC LAYER (point-in-time truth)        │
├───────────────────────────────────────────────────────────────────────┤
│  LAYER 1 — DATA INGESTION & NORMALIZATION (raw → canonical)           │
├───────────────────────────────────────────────────────────────────────┤
│  LAYER 0 — PLATFORM / INFRASTRUCTURE (compute, storage, bus, registry) │
└───────────────────────────────────────────────────────────────────────┘
        ▲                                                        ▲
        └──────────  AGENT MESH (orchestrated, cross-layer)  ────┘
        └──────────  MEMORY FABRIC (short/long/episodic/semantic) ─┘
```

Two spines run through everything:

- **The Artifact Registry** (Layer 0): the immutable, versioned record of every object the system ever produces.
- **The Agent Mesh + Orchestrator**: the nervous system that decides what work happens next.

---

## 2. Complete Folder Architecture

Root: `hedgefund-research-os/`

I present the top-level tree first, then document each folder with the six required fields.

```
hedgefund-research-os/
├── platform/                  # Layer 0 — infra, cross-cutting primitives
├── data_ingestion/            # Layer 1 — raw acquisition & normalization
├── data_semantic/             # Layer 2 — point-in-time feature store & lineage
├── research_engine/           # Layer 3 — hypothesis lifecycle
├── factor_engineering/        # Layer 4 — factor/signal production
├── validation/                # Layer 5 — statistical adversary
├── backtesting/               # Layer 6 — simulation engine
├── portfolio/                 # Layer 7 — construction & optimization
├── execution/                 # Layer 8 — order lifecycle, paper→live
├── governance/                # Layer 9 — risk, compliance, kill-switches
├── agents/                    # Agent mesh (all specialized agents)
├── orchestration/             # Task graph, scheduling, workflow
├── memory/                    # Memory fabric
├── knowledge/                 # Company research, ontologies, research corpus
├── asset_adapters/            # Per-asset-class pluggable specifics
├── interfaces/                # APIs, dashboards, human-in-the-loop consoles
├── evaluation/                # System self-assessment & meta-research
├── contracts/                 # Schemas, message/artifact contracts (source of truth)
├── config/                    # Environment, secrets refs, feature flags
├── ops/                       # CI/CD, IaC, observability, runbooks
└── docs/                      # ADRs, design docs, this document
```

Now, folder by folder.

---

### 2.1 `platform/` — Layer 0: Infrastructure Primitives

```
platform/
├── artifact_registry/     # immutable versioned object store + metadata index
├── message_bus/           # async event backbone abstraction
├── compute_fabric/        # job submission, distributed compute abstraction
├── storage/               # object store, timeseries db, graph db, blob adapters
├── secrets/               # secrets/credentials broker (references only)
├── observability/         # logging, metrics, tracing, cost accounting
├── identity/              # service identity, RBAC, audit identity
└── clock/                 # centralized time authority (PIT-safe simulated clock)
```

- **Purpose.** Provide the substrate every other layer stands on: storage, messaging, compute, identity, time, observability. Nothing here knows anything about finance.
- **Responsibilities.** Abstract away concrete infrastructure (which database, which queue, which cloud) behind stable internal interfaces so vendors are swappable. Guarantee immutability and content-addressing of artifacts. Provide the _authoritative clock_ — critical, because backtests run on simulated time and the whole system must never accidentally read wall-clock time during a simulation.
- **Inputs.** Configuration (`config/`), infrastructure credentials (via `secrets/`).
- **Outputs.** Stable service interfaces: `put/get artifact`, `publish/subscribe event`, `submit job`, `now()`.
- **Dependencies.** Cloud provider / on-prem hardware only. No dependency on any other project folder (it is the bottom).
- **Future scalability.** The `clock/` and `artifact_registry/` are the enablers of reproducibility at any scale. `compute_fabric/` starts as a local executor and grows to a distributed scheduler (Ray/Dask/K8s) without callers changing. `storage/` adapters let you migrate from Postgres+Parquet to a columnar warehouse + tiered object store as data volume explodes into alt-data and tick data.

**Why `clock/` is its own primitive:** In a research OS, "what time is it?" is a _business-critical, correctness-critical_ question. Simulated time (backtest), replay time (paper), and real time (live) must be injectable. Any code that calls the OS wall clock directly is a latent lookahead bug. Centralizing it makes that bug impossible by construction.

---

### 2.2 `data_ingestion/` — Layer 1: Raw Acquisition & Normalization

```
data_ingestion/
├── connectors/            # one module per external source (vendor-specific)
│   ├── market_data/
│   ├── fundamentals/
│   ├── macro/
│   ├── news_text/
│   ├── alternative/
│   └── crypto/
├── normalizers/           # vendor schema → canonical schema
├── symbology/             # cross-vendor identifier resolution & mapping
├── corporate_actions/     # splits, dividends, delistings, mergers
├── quality_gates/         # ingestion-time validation, anomaly detection
├── bitemporal_writer/     # writes with (event_time, knowledge_time)
└── raw_vault/             # immutable landing zone (as-received bytes)
```

- **Purpose.** Turn the messy, heterogeneous outside world into clean, canonical, **bitemporally-stamped** internal data — without ever discarding or overwriting what was originally received.
- **Responsibilities.**
  - Pull from each source via an isolated connector (one connector = one responsibility).
  - Land raw payloads immutably in `raw_vault/` (so you can re-derive everything if a normalizer bug is found later).
  - Normalize to canonical schemas defined in `contracts/`.
  - Resolve identifiers across vendors (`symbology/`) — the same company has different tickers/CUSIPs/ISINs across sources; Turkish equities and crypto have their own identifier regimes.
  - Handle corporate actions correctly (the #1 source of silent backtest corruption).
  - Stamp every record with **both** `event_time` (when it happened in the world) and `knowledge_time` (when we learned it) — the foundation of point-in-time correctness.
  - Reject/quarantine bad data at the gate.
- **Inputs.** External vendor APIs/files/streams; symbology reference data.
- **Outputs.** Canonical, bitemporal, validated records written to Layer 2's store; quarantine reports; ingestion lineage records.
- **Dependencies.** `platform/` (storage, clock, bus), `contracts/` (canonical schemas), `asset_adapters/` (for asset-specific corporate-action and calendar logic).
- **Future scalability.** New asset classes and vendors = new isolated connectors + normalizers; the rest of the system is untouched. Streaming vs batch handled by the same normalizer interface. Alt-data (satellite, card transactions, web-scrape) plugs in as new connector families. The `bitemporal_writer/` and `raw_vault/` mean you can _always_ reconstruct any prior data state — essential when a vendor silently restates history.

**Non-negotiable design rule:** the research side never reads raw vendor data. It reads only canonical, bitemporal records. This firewall is what makes multi-asset, multi-vendor expansion safe.

---

### 2.3 `data_semantic/` — Layer 2: Point-in-Time Feature & Semantic Layer

```
data_semantic/
├── feature_store/         # named, versioned features w/ PIT retrieval
├── datasets/              # curated, snapshotted research datasets
├── pit_engine/            # as-of query engine (knowledge_time <= T)
├── universe/              # tradable-universe definitions per date (survivorship-safe)
├── lineage/               # data provenance graph (source→feature→model)
├── calendars/             # trading calendars, sessions, holidays per market
├── entity_graph/          # companies, sectors, supply chains, ownership
└── data_catalog/          # discoverable metadata, docs, freshness, quality SLAs
```

- **Purpose.** Present a _semantically meaningful, point-in-time-correct_ view of all data to researchers and agents. This is the layer that says "as of this date, here is exactly what a rational actor could have known."
- **Responsibilities.**
  - Serve features **as-of** any historical timestamp (`pit_engine`), guaranteeing no lookahead.
  - Maintain survivorship-bias-free universes (delisted names still present in historical universes).
  - Version and document every feature (`feature_store`, `data_catalog`).
  - Snapshot immutable `datasets/` for research runs so a backtest can be reproduced byte-for-byte years later.
  - Track full lineage (`lineage/`) so any factor can be traced to raw sources.
  - Model entity relationships (`entity_graph/`) — needed for company research, sector-neutrality, supply-chain factors, ownership/insider analysis.
- **Inputs.** Canonical bitemporal records from Layer 1; universe rules; calendars.
- **Outputs.** PIT feature vectors, immutable dataset snapshots, universe memberships, lineage records.
- **Dependencies.** `platform/`, `data_ingestion/`, `contracts/`, `asset_adapters/` (calendars, universe rules per market).
- **Future scalability.** The feature store is the shared vocabulary for all alpha work; new features (from any asset class) register here and become instantly discoverable and reusable. The `entity_graph/` grows from equities into crypto tokens, macro entities, and cross-asset relationships. PIT engine performance is the scaling frontier — start with columnar as-of joins, evolve to a dedicated temporal store.

**This is arguably the most important layer for institutional credibility.** If Layer 2 is correct, garbage results are honest garbage you can trust. If Layer 2 leaks the future, _every_ downstream result is a lie that looks like gold.

---

### 2.4 `research_engine/` — Layer 3: Hypothesis Lifecycle (The Brain)

```
research_engine/
├── hypothesis_registry/   # every hypothesis as an immutable, tracked object
├── idea_intake/           # structured capture from agents & humans
├── literature/            # academic + practitioner research corpus & synthesis
├── experiment_designer/   # turns a hypothesis into a testable experiment spec
├── research_notebooks/    # reproducible research runs (as artifacts, not ad-hoc)
├── multiple_testing/      # global registry of tests run (for p-value deflation)
├── research_graph/        # DAG linking ideas→experiments→results→conclusions
└── decision_log/          # why ideas were promoted/killed (institutional memory)
```

- **Purpose.** Manage the full lifecycle of a research idea: **conceived → specified → tested → judged → promoted or killed → remembered.** This is where "research automatically" actually lives.
- **Responsibilities.**
  - Represent every hypothesis as a first-class, versioned object with a formal statement, an economic rationale, a falsifiable prediction, and a pre-registered test plan. **Pre-registration is enforced** — you declare success criteria _before_ seeing results.
  - Design experiments (`experiment_designer`): specify universe, horizon, features, null hypothesis, required significance _after_ multiple-testing correction.
  - Maintain the **global count of hypotheses tested** (`multiple_testing`). This is what lets Layer 5 deflate significance honestly — the single most important defense against fooling yourself.
  - Keep a `decision_log` — an institutional memory of why every idea lived or died, so the fund doesn't re-test dead ideas or forget hard-won lessons.
- **Inputs.** Ideas from agents (Hypothesis Generator) and humans; literature; the feature catalog; prior decisions from `memory/`.
- **Outputs.** Formal experiment specs → to `factor_engineering/` and `backtesting/`; hypothesis status transitions; the research graph.
- **Dependencies.** `data_semantic/`, `memory/`, `contracts/`, `agents/`.
- **Future scalability.** Asset-agnostic — a hypothesis about crypto funding rates and one about Turkish equity earnings drift are the same object type. The `literature/` corpus and `research_graph/` compound over time into a durable knowledge moat. As agent throughput grows, `multiple_testing/` becomes the throttle that keeps statistical honesty intact under industrial-scale idea generation.

**Design rule that protects statistical integrity:** the research engine _tracks_ how many bets it's placing on randomness. You cannot honestly claim a discovery without accounting for how many things you tried. This registry is the accounting.

---

### 2.5 `factor_engineering/` — Layer 4: Factor & Signal Production

```
factor_engineering/
├── factor_library/        # versioned, documented factor definitions
├── factor_generators/     # transforms, combinations, learned features
│   ├── formulaic/         # analyst/agent-authored expressions
│   ├── learned/           # ML-derived features/embeddings
│   └── symbolic_search/   # automated factor discovery (genetic/programmatic)
├── signal_processing/     # normalization, winsorization, neutralization, decay
├── factor_analytics/      # IC, IR, turnover, decay, capacity per factor
├── orthogonalization/     # residualize vs known/common factors
├── factor_zoo_guard/      # dedup & redundancy control vs existing factors
└── alpha_combination/     # meta-model blending of validated signals
```

- **Purpose.** Produce, characterize, and refine **factors** (signals with predictive intent) and combine validated ones into composite alphas. This is the "generate new factors" engine.
- **Responsibilities.**
  - Author factors three ways: human/agent formulaic expressions, ML-learned features, and _automated symbolic search_ (the RenTec-flavored engine that programmatically searches factor space).
  - Apply correct signal hygiene (`signal_processing`): cross-sectional standardization, outlier control, sector/beta neutralization, decay modeling.
  - Compute standard factor analytics (`factor_analytics`): information coefficient, information ratio, turnover, half-life, capacity.
  - **Orthogonalize** new factors against known risk factors and existing library factors — a "new" factor that is 95% momentum is not new.
  - Guard against factor-zoo bloat (`factor_zoo_guard`): reject redundant factors.
  - Blend validated signals (`alpha_combination`) into portfolio-ready composite alphas.
- **Inputs.** Experiment specs from Layer 3; PIT features from Layer 2.
- **Outputs.** Versioned factor definitions + their raw signal timeseries → to `validation/` and `backtesting/`; factor analytics reports.
- **Dependencies.** `data_semantic/`, `research_engine/`, `contracts/`, `platform/compute_fabric`.
- **Future scalability.** Factor generators are pluggable strategies; the symbolic search engine scales directly with compute. New asset classes contribute new raw features but reuse the entire factor-hygiene and analytics pipeline. `alpha_combination` evolves from simple weighting to regime-aware meta-models.

**Firewall rule:** factor engineering produces signals and _descriptive_ analytics but does **not** judge whether a factor is "real." That judgment belongs exclusively to Layer 5. Separating production from adjudication prevents the classic failure where the person who built the factor also decides it's significant.

---

### 2.6 `validation/` — Layer 5: Statistical Defense (The Adversary)

```
validation/
├── validation_gauntlet/   # orchestrated battery of tests a factor must pass
├── deflation/             # deflated Sharpe, multiple-testing p-value adjustment
├── robustness/            # subperiod, subuniverse, parameter-perturbation tests
├── overfitting_tests/     # CSCV/PBO, data-snooping detection
├── regime_analysis/       # performance conditional on market regimes
├── null_models/           # synthetic/shuffled data — does the signal survive noise?
├── oos_vault/             # sealed out-of-sample data (research side has NO access)
└── validation_verdicts/   # immutable pass/fail with full evidence
```

- **Purpose.** **Attack every candidate factor and hypothesis** and try to prove it's noise. This layer's institutional mandate is skepticism. It is the fund's immune system.
- **Responsibilities.**
  - Run the `validation_gauntlet`: a fixed, versioned battery every factor must survive.
  - Deflate performance metrics for the number of trials (`deflation`) using the count from Layer 3's `multiple_testing`. Report **deflated Sharpe**, not naive Sharpe.
  - Robustness: does it survive different subperiods, sub-universes, small parameter changes? A signal that only works with exact parameters is overfit.
  - Overfitting probability (`overfitting_tests`): compute Probability of Backtest Overfitting.
  - Regime conditioning: is the edge real or just a bull-market artifact?
  - Null models: run the identical process on shuffled/synthetic data — if "alpha" appears there too, it's your pipeline manufacturing false positives.
  - Guard the **out-of-sample vault** (`oos_vault`): a sealed data segment the entire research/factor side is _architecturally forbidden_ to access. Final validation runs here, once, near the end. Access is logged and rationed.
- **Inputs.** Candidate factors + specs from Layer 4/3; the global test count; PIT data (in-sample for iteration, OOS only at the final gate).
- **Outputs.** Immutable **verdicts** (pass/fail + full statistical evidence) → gate promotion into Layers 6–7.
- **Dependencies.** `data_semantic/`, `research_engine/multiple_testing`, `contracts/`, `governance/`.
- **Future scalability.** The gauntlet is a versioned pipeline of pluggable tests — new statistical defenses are added without disturbing callers. Asset-agnostic. As idea throughput rises, this layer's rigor is what prevents the factory from drowning the fund in false discoveries.

**The most important architectural firewall in the entire system:** the code that generates ideas (Layers 3–4) can **never** touch the `oos_vault`. This is enforced by identity/RBAC at Layer 0, not by convention. Every access is audited. This single boundary is the difference between a research OS and an elaborate overfitting machine.

---

### 2.7 `backtesting/` — Layer 6: Institutional Simulation

```
backtesting/
├── engine/                # event-driven, point-in-time simulation core
├── market_model/          # fills, slippage, market impact, latency, borrow
├── cost_model/            # commissions, fees, financing, taxes, spread
├── universe_sim/          # PIT universe & corporate-action-aware simulation
├── scenario_lab/          # stress, historical replay, Monte Carlo, bootstrap
├── attribution/           # P&L attribution to factors/costs/timing
├── capacity_model/        # how much capital before alpha decays
└── backtest_registry/     # immutable, reproducible backtest artifacts
```

- **Purpose.** Simulate strategy performance with **institutional realism** — costs, impact, capacity, borrow, latency — reproducibly. A backtest here is a scientific experiment, not a marketing chart.
- **Responsibilities.**
  - Event-driven simulation on the _simulated clock_ (never wall-clock), consuming only PIT data.
  - Realistic market microstructure: partial fills, slippage, **market impact** (crucial — this is where naive backtests lie most), latency, short-borrow availability and cost.
  - Full cost modeling including financing, taxes, and asset-specific frictions.
  - Corporate-action-correct position accounting.
  - Scenario lab: historical crisis replays, Monte Carlo, block bootstrap, synthetic paths.
  - P&L attribution — _why_ did it make/lose money?
  - **Capacity modeling** — the institutional question retail systems ignore: at what AUM does the edge evaporate?
  - Emit fully reproducible, immutable backtest artifacts (config + data-snapshot ref + code version + results).
- **Inputs.** Validated factors/strategies (post-Layer-5 gate); PIT datasets; cost/market model configs; asset adapters.
- **Outputs.** Immutable backtest artifacts with metrics, attribution, capacity → to `portfolio/` and `evaluation/`.
- **Dependencies.** `data_semantic/`, `asset_adapters/` (per-asset market/cost/microstructure models), `platform/compute_fabric` + `clock`, `contracts/`.
- **Future scalability.** The engine core is asset-agnostic; realism lives in swappable `market_model`/`cost_model` per asset class (equities ≠ options ≠ crypto ≠ futures). Options require a pricing/greeks model; futures require roll logic; crypto requires 24/7 sessions and exchange-specific fees — all injected via `asset_adapters/`, never hardcoded in the engine. Scenario lab scales with `compute_fabric`.

**Design rule:** the backtest engine must be able to run in three modes with identical code — **historical simulation**, **paper (replay/live-shadow)**, and eventually **live** — differing only in which clock and which execution adapter are injected. This is what makes the paper→live transition trustworthy.

---

### 2.8 `portfolio/` — Layer 7: Construction & Optimization

```
portfolio/
├── alpha_forecasts/       # expected returns from validated composite alphas
├── risk_models/           # covariance, factor risk, tail risk
├── optimizer/             # portfolio construction under constraints
├── constraints/           # exposure, leverage, liquidity, concentration limits
├── transaction_cost_opt/  # cost-aware rebalancing (net-of-cost optimization)
├── capital_allocation/    # allocation across strategies/sleeves (meta-portfolio)
├── rebalance_planner/     # target vs current → trade list
└── portfolio_registry/    # immutable portfolio snapshots & rationale
```

- **Purpose.** Convert validated alphas + risk models into **actual target portfolios** that respect real-world constraints and are optimized _net of costs_. "Institutional-quality portfolios" lives here.
- **Responsibilities.**
  - Translate composite alphas into expected-return forecasts.
  - Build and maintain risk models (factor covariance, tail risk).
  - Optimize under constraints (leverage, sector/factor exposure, liquidity, position and concentration limits, turnover).
  - **Cost-aware optimization** — maximize _net_ utility, not gross return; avoid churning.
  - Allocate capital across multiple validated strategies (meta-portfolio / risk budgeting) — the fund is a portfolio of alphas, not one alpha.
  - Produce immutable target-portfolio snapshots with full rationale.
- **Inputs.** Validated composite alphas (Layer 4, post-Layer-5), backtest capacity estimates (Layer 6), risk models, live positions (Layer 8), constraint configs (from `governance/`).
- **Outputs.** Target portfolios + rebalance trade lists → to `execution/`; portfolio snapshots → `evaluation/`.
- **Dependencies.** `factor_engineering/`, `backtesting/` (capacity), `governance/` (limits), `asset_adapters/` (liquidity, tradability), `contracts/`.
- **Future scalability.** Optimizer and risk models are strategy interfaces (mean-variance → risk-parity → robust/Bayesian → hierarchical). Multi-asset and cross-asset portfolios handled by a unified risk model spanning asset adapters. Capital allocation across sleeves scales the fund from one strategy to hundreds without structural change.

**Firewall:** portfolio construction consumes only _already-validated_ alphas. It never re-opens the question of whether a signal is real; it only decides how to size and combine trusted signals under constraints. Alpha truth (Layer 5) and alpha capture (Layer 7) stay separate.

---

### 2.9 `execution/` — Layer 8: Order Lifecycle (Paper → Live)

```
execution/
├── order_management/      # OMS: order lifecycle, state machine
├── execution_algos/       # TWAP/VWAP/POV/implementation-shortfall
├── broker_adapters/       # venue/broker/exchange connectors (pluggable)
├── smart_router/          # venue selection, order splitting
├── paper_engine/          # simulated/shadow execution (default mode)
├── tca/                   # transaction cost analysis (realized vs modeled)
├── position_ledger/       # authoritative real-time positions & cash
└── reconciliation/        # broker vs internal ledger reconciliation
```

- **Purpose.** Turn target portfolios into executed orders, starting in **paper/shadow mode** and only later, gated by governance, in live mode. Measure realized execution quality and feed it back.
- **Responsibilities.**
  - OMS with a rigorous order state machine.
  - Execution algorithms to minimize impact.
  - Broker/exchange adapters (equities, crypto exchanges, futures, options venues) — pluggable, per asset class.
  - **Paper engine as the default** — the system lives in shadow mode until it earns live capital through governance gates.
  - **TCA**: compare realized costs to the backtest's modeled costs — this closes the loop that keeps backtests honest.
  - Authoritative position/cash ledger and daily reconciliation with brokers.
- **Inputs.** Rebalance trade lists from Layer 7; market data; governance authorizations.
- **Outputs.** Executed fills, realized positions, TCA reports → to `portfolio/` (state) and `evaluation/` (backtest-vs-reality calibration).
- **Dependencies.** `portfolio/`, `governance/` (live-trading authorization + kill-switch), `asset_adapters/`, `platform/`, `contracts/`.
- **Future scalability.** New venues = new adapters. The paper→live promotion is a config/identity change, not a code fork, because the same engine runs both. TCA data continuously recalibrates the backtest cost models (Layer 6), tightening the sim-to-real gap as the fund grows.

**Governance interlock:** live execution is _impossible_ without an explicit, time-boxed authorization token issued by Layer 9, and any kill-switch instantly forces the router into paper mode. Safety is structural.

---

### 2.10 `governance/` — Layer 9: Risk, Compliance, Oversight

```
governance/
├── risk_limits/           # pre-trade & portfolio-level limit definitions
├── risk_monitors/         # real-time exposure/VaR/drawdown monitoring
├── kill_switches/         # graduated halts (strategy→sleeve→fund-wide)
├── compliance/            # mandate, regulatory, market-specific rules
├── approvals/             # human-in-the-loop promotion gates & sign-offs
├── audit_trail/           # immutable, tamper-evident record of all decisions
├── circuit_breakers/      # automated protective responses to anomalies
└── policy_engine/         # declarative policies enforced across layers
```

- **Purpose.** The independent oversight layer that constrains everything else. It has authority to **halt** any part of the system. Models the fund's risk committee and compliance function in code.
- **Responsibilities.**
  - Define and enforce risk limits pre-trade and at portfolio level.
  - Real-time monitoring of exposure, VaR, drawdown, leverage.
  - Graduated kill-switches and automated circuit breakers.
  - Compliance rules — including **market-specific** ones (Turkish market rules, crypto jurisdictional constraints, options/futures margin regimes differ per venue).
  - Human approval gates: promotion to live capital, capital increases, and any override of an automated block require human sign-off (`approvals`).
  - A single tamper-evident `audit_trail` spanning every consequential decision — who/what/when/why — for regulators and post-mortems.
  - A declarative `policy_engine` other layers query ("may I do X?").
- **Inputs.** Real-time state from `execution/` and `portfolio/`; policies; human approvals.
- **Outputs.** Authorizations, blocks, halts, alerts, audit records; the live-trading token.
- **Dependencies.** Reads across all layers via the bus; enforced by `platform/identity`. Independent of the research side by design.
- **Future scalability.** Policies are declarative and versioned; new asset classes add new compliance/risk modules without touching enforcement machinery. As capital and asset breadth grow, this layer is what keeps the fund inside its mandate and regulators satisfied.

**Principle of adversarial independence:** governance must not report to research. Just as Layer 5 attacks Layer 4's ideas, Layer 9 constrains Layers 7–8's actions. Independence of oversight is architectural.

---

### 2.11 `agents/` — The Agent Mesh

Per your hard requirement: **one agent, one responsibility.** Agents are stateless workers that consume tasks from the bus, read/write immutable artifacts, and never share mutable memory. Grouped by the layer they serve.

```
agents/
├── base/                  # agent runtime contract, lifecycle, tool-use protocol
├── data_agents/
│   ├── source_scout/          # discovers/evaluates new data sources
│   ├── ingestion_monitor/     # watches feed health & freshness
│   └── data_quality_sentinel/ # flags anomalies, breaks, restatements
├── research_agents/
│   ├── literature_miner/      # reads papers/filings, extracts testable ideas
│   ├── hypothesis_generator/  # proposes falsifiable hypotheses (ONLY proposes)
│   ├── experiment_designer/   # formalizes hypothesis into a test spec
│   └── company_researcher/    # deep-dives a single company (fundamentals+context)
├── factor_agents/
│   ├── factor_author/         # writes candidate factor definitions
│   ├── factor_search/         # drives automated symbolic factor search
│   └── factor_critic/         # explains/interprets factor economics (NOT validate)
├── validation_agents/
│   ├── skeptic/               # actively tries to falsify a candidate (adversary)
│   ├── robustness_examiner/   # runs & interprets robustness battery
│   └── overfitting_auditor/   # judges data-snooping / PBO risk
├── portfolio_agents/
│   ├── risk_analyst/          # interprets risk model output
│   └── allocation_strategist/ # reasons about capital allocation across sleeves
├── execution_agents/
│   └── tca_analyst/           # analyzes realized execution vs model
├── governance_agents/
│   ├── compliance_officer/    # checks mandate/regulatory conformance
│   └── risk_supervisor/       # monitors limits, recommends halts
├── meta_agents/
│   ├── research_director/     # prioritizes the research agenda (orchestration brain)
│   ├── portfolio_manager/     # synthesizes: what does the fund actually do
│   ├── post_mortem/           # writes lessons from wins/losses into memory
│   └── system_critic/         # audits the OS itself for process failures
└── registry/                  # agent capability registry & routing metadata
```

- **Purpose.** Provide the autonomous cognition that drives the research factory: discovering data, generating hypotheses, authoring factors, attacking them, interpreting results, prioritizing work, and learning.
- **Responsibilities.** Each agent does exactly one job and produces immutable artifacts + messages. Critical role separations, enforced by the mesh:
  - `hypothesis_generator` **proposes** but never tests or judges.
  - `skeptic`/`overfitting_auditor` **attack** but never generate the ideas they attack.
  - `factor_critic` **interprets** economics but has no authority to pass a factor.
  - `research_director` **prioritizes** but does not itself do research.
  - `portfolio_manager` (agent) **synthesizes** but cannot bypass `governance/`.
- **Inputs.** Tasks from `orchestration/`; artifacts from the registry; context from `memory/`; PIT data via Layer 2.
- **Outputs.** New artifacts (hypotheses, factors, verdicts-input, reports) + events on the bus; memory writes.
- **Dependencies.** `agents/base` runtime, `platform/message_bus`, `memory/`, `contracts/`, and whichever layer they serve.
- **Future scalability.** Agents are horizontally scalable stateless workers. New capabilities = new single-purpose agents registered in `registry/`. The underlying model powering any agent (which LLM, or a non-LLM heuristic) is swappable behind `agents/base` — an agent is defined by its _responsibility and contract_, not its brain. Multiple instances of the same agent run in parallel for throughput.

**Why the strict one-job rule matters technically, not just organizationally:** conflicts of interest between generation and adjudication are the root cause of overfitting and hidden risk. Encoding role separation into distinct agents makes those conflicts _impossible to collapse_ into one biased process. It also makes each agent independently testable, replaceable, and auditable.

---

### 2.12 `orchestration/` — Task Graph & Workflow

```
orchestration/
├── task_graph/            # DAG definition of research/ops workflows
├── scheduler/             # triggers: time, event, dependency-based
├── workflow_engine/       # durable, resumable execution of long workflows
├── queues/                # per-priority, per-capability task queues
├── router/                # matches tasks to capable agents (via registry)
├── budget_governor/       # compute/cost budgets & backpressure
├── saga_coordinator/      # multi-step transactions w/ compensation
└── run_ledger/            # immutable record of every task run
```

- **Purpose.** Decide **what work happens, in what order, by whom, under what budget.** The conductor of the agent mesh and the pipelines.
- **Responsibilities.** Express workflows as durable DAGs; schedule by time/event/dependency; route tasks to capable agents; enforce compute and cost budgets with backpressure; coordinate multi-step processes with compensation on failure (a validation run that fails must roll back cleanly); record every run immutably.
- **Inputs.** Workflow definitions; events from the bus; priorities from `research_director`; budgets from `governance/`.
- **Outputs.** Dispatched tasks; run records; completion events.
- **Dependencies.** `platform/message_bus` + `compute_fabric`, `agents/registry`, `contracts/`.
- **Future scalability.** Workflow engine and scheduler scale horizontally; budget governor keeps a runaway automated-research factory from bankrupting itself on compute. New workflows (new asset onboarding, new research campaigns) are added declaratively. This layer turns "many agents" into "a coordinated institution."

---

### 2.13 `memory/` — Memory Fabric

```
memory/
├── working_memory/        # short-lived per-task/agent scratch context
├── episodic_memory/       # what happened: runs, decisions, outcomes over time
├── semantic_memory/       # distilled knowledge: what we believe about markets
├── procedural_memory/     # how-to: workflows/playbooks that worked
├── vector_index/          # embeddings for retrieval across corpora
├── knowledge_graph/       # entities, relationships, causal beliefs
├── memory_curator/        # consolidation, decay, contradiction resolution
└── memory_api/            # scoped read/write with provenance & access control
```

- **Purpose.** Give the system durable, structured **institutional memory** — so it accumulates wisdom instead of repeating mistakes. This is the substrate of "continuously improve itself."
- **Responsibilities.**
  - **Working**: ephemeral context for an in-flight task (discarded after).
  - **Episodic**: the timeline of hypotheses tested, factors killed, trades made, outcomes realized.
  - **Semantic**: distilled, deduplicated beliefs ("post-earnings drift is weak in large-cap US since ~2015").
  - **Procedural**: reusable playbooks that have proven effective.
  - **Curation**: consolidate, decay stale beliefs, and _resolve contradictions_ — vital, because an automated system will otherwise accumulate mutually inconsistent conclusions.
  - Every memory carries **provenance** (which run/agent produced it) and is access-scoped (the OOS firewall extends into memory — research agents can't recall OOS-derived facts).
- **Inputs.** Artifacts and outcomes from all layers; `post_mortem` agent writes; decision logs.
- **Outputs.** Retrieval results to agents; consolidated knowledge; contradiction alerts.
- **Dependencies.** `platform/storage` (vector + graph + object), `contracts/`, `governance/` (access control).
- **Future scalability.** Vector + graph stores scale independently. Curation prevents unbounded memory rot. As the fund runs for years, this compounding memory becomes the true moat — the thing a competitor cannot copy. The four memory types map cleanly onto standard cognitive-memory architecture, keeping retrieval targeted and cheap.

**Design rule:** agents never hold long-term state internally. All durable knowledge lives in the memory fabric with provenance. This keeps agents stateless/replaceable and makes the fund's "mind" inspectable and governable.

---

### 2.14 `knowledge/` — Research Corpus & Ontologies

```
knowledge/
├── company_dossiers/      # structured, versioned per-company research
├── ontologies/            # sectors, factors, instruments, macro taxonomy
├── research_reports/      # generated institutional-grade write-ups
├── market_models/         # documented beliefs about market mechanics/regimes
├── data_dictionary/       # canonical definitions of every field & term
└── external_corpus/       # ingested papers, filings, transcripts (indexed)
```

- **Purpose.** The human-and-machine-readable **body of knowledge** the fund builds: company research, taxonomies, market models, and the definitions that give every other layer a shared language. Distinct from `memory/` — `memory/` is the _cognitive substrate_ (with decay/curation); `knowledge/` is the _published, citable corpus_.
- **Responsibilities.** Maintain deep company dossiers (feeds "research companies automatically"); own the ontologies/taxonomies that keep multi-asset data coherent; store generated research reports as institutional deliverables; document market-mechanics beliefs; be the authoritative data dictionary.
- **Inputs.** `company_researcher` and `literature_miner` agents; validated conclusions; external corpus ingestion.
- **Outputs.** Dossiers and reports to humans and agents; ontologies to Layer 2's entity graph; definitions to all.
- **Dependencies.** `memory/`, `data_semantic/entity_graph`, `contracts/`.
- **Future scalability.** Ontologies extend to new asset classes; dossiers extend to crypto projects, ETFs, macro entities. The corpus grows into a searchable institutional library. Clean taxonomies here are what let a cross-asset factor even be _expressed_.

---

### 2.15 `asset_adapters/` — Per-Asset-Class Plug-ins

```
asset_adapters/
├── contract/              # the interface every asset class must implement
├── us_equities/
├── turkish_equities/
├── etfs/
├── options/
├── futures/
├── crypto/
├── macro/
└── alt_data/
```

- **Purpose.** Isolate **everything asset-class-specific** behind a uniform contract so the core never branches on asset type. This is the single most important structural decision for your multi-asset requirement.
- **Responsibilities.** Each adapter implements the standard `contract/`: trading calendar & sessions, identifier/symbology rules, corporate-action semantics, tradability/liquidity model, market-microstructure & cost model, risk-model specifics, execution venue mapping, and compliance rules for that market. Examples of divergence the adapter absorbs: options need greeks/vol-surface & expiry; futures need roll/contango; crypto needs 24/7 sessions, on-chain data, exchange fees; Turkish equities need local calendar, currency, and regulatory rules; macro/alt-data are non-tradable feeds that only enrich features.
- **Inputs.** The uniform contract definition; per-market reference data.
- **Outputs.** Asset-specific behavior consumed by Layers 1, 2, 6, 7, 8, 9.
- **Dependencies.** `contracts/`, and the layers that call them (via inversion of control — the core depends on the _interface_, not the adapter).
- **Future scalability.** **This is the extension seam of the whole platform.** Adding an asset class = writing one new adapter that satisfies the contract; zero changes to research, validation, backtest core, or portfolio math. This is precisely how you go from US stocks to a nine-asset-class institution without a rewrite.

---

### 2.16 `evaluation/` — System Self-Assessment & Meta-Research

```
evaluation/
├── strategy_scorecards/   # live vs backtest performance tracking
├── model_monitoring/      # alpha decay, drift, degradation detection
├── sim_to_real_gap/       # systematic backtest-vs-reality calibration
├── research_productivity/ # hit-rate of hypotheses, false-discovery rate
├── benchmarking/          # vs benchmarks, peers, factor exposures
├── self_improvement/      # proposes changes to the OS's own processes
└── experiment_meta/       # meta-analysis across all experiments ever run
```

- **Purpose.** Let the system **grade itself and improve** — the "continuously improve itself" goal, implemented rigorously rather than as a slogan.
- **Responsibilities.** Track live-vs-backtest divergence per strategy; detect alpha decay and model drift; quantify the systematic sim-to-real gap and feed corrections back to Layer 6 cost models; measure _research productivity_ (what fraction of hypotheses become durable alpha — the fund's true efficiency metric) and the realized false-discovery rate; benchmark performance and exposures; run meta-analysis across all experiments to find _what kinds of research work_; and propose concrete process improvements to the OS itself (consumed by human review + `system_critic` agent).
- **Inputs.** Backtest artifacts, live results (Layer 8), verdicts (Layer 5), decision logs (Layer 3).
- **Outputs.** Scorecards, drift alerts, calibration updates, self-improvement proposals.
- **Dependencies.** Reads across all layers; `memory/`; `governance/` (improvements to live systems need approval).
- **Future scalability.** As the experiment corpus grows, meta-analysis gets sharper — the system learns _how to do research better_, not just _what to trade_. Self-improvement proposals are always human/governance-gated to prevent unsafe autonomous self-modification.

---

### 2.17 `contracts/` — Schemas & Contracts (Source of Truth)

```
contracts/
├── canonical_data/        # canonical record schemas (all asset classes)
├── artifacts/             # hypothesis, factor, backtest, portfolio, verdict schemas
├── messages/              # event/message schemas for the bus
├── agent_io/              # per-agent input/output contracts
├── adapter_interface/     # the asset-adapter contract
├── versioning/            # schema evolution & compatibility rules
└── validation_rules/      # cross-cutting invariants (e.g., PIT, immutability)
```

- **Purpose.** Be the **single source of truth** for every data shape, message, and interface. Contracts are what make "everything replaceable" actually true — components integrate against schemas, not against each other.
- **Responsibilities.** Define and version all schemas; enforce backward/forward compatibility; encode cross-cutting invariants (bitemporal stamping, immutability, provenance-required). Any component in any language conforms to these.
- **Inputs.** Design decisions (ADRs in `docs/`).
- **Outputs.** Contracts consumed at build/runtime by every folder.
- **Dependencies.** None (it's a leaf that everything depends on — the "waist" of the hourglass).
- **Future scalability.** Schema evolution rules allow the system to change shape over years without breaking historical artifacts. This is the linchpin of modularity and replaceability: swap any implementation freely as long as it honors the contract.

---

### 2.18 `interfaces/`, `config/`, `ops/`, `docs/` (Supporting)

- **`interfaces/`** — **Purpose:** human access & control (research consoles, dashboards, approval UIs, programmatic API). **Responsibilities:** surface the research graph, run backtests on demand, review verdicts, approve promotions, monitor risk, drive human-in-the-loop gates. **Inputs:** reads across layers. **Outputs:** human decisions back into `governance/approvals` and `orchestration/`. **Dependencies:** all layers via read APIs. **Scalability:** additive — new views/apps without touching the core. Humans remain in the loop at every consequential gate by design.
- **`config/`** — environment configs, feature flags, secret _references_ (never secrets themselves), per-environment (research/paper/live) settings. Enables the same code to run in every mode by injection.
- **`ops/`** — CI/CD, infrastructure-as-code, observability dashboards, cost accounting, runbooks, disaster recovery. Keeps the platform reproducible and operable.
- **`docs/`** — Architecture Decision Records (ADRs), design docs, this document. Institutional memory for _why_ the system is shaped as it is.

---

## 3. Data Flow

**Raw → Canonical → PIT → Research → Alpha → Validated → Portfolio → Execution → Feedback.**

1. **Acquisition (L1).** Connectors pull from vendors; raw bytes land immutably in `raw_vault`. Normalizers map to canonical schemas; `symbology` resolves identifiers; `corporate_actions` are captured; `bitemporal_writer` stamps `(event_time, knowledge_time)`; `quality_gates` quarantine bad data.
2. **Semantic elevation (L2).** Canonical records become PIT-queryable features in the `feature_store`. Universes are built survivorship-safe. `datasets/` are snapshotted immutably for reproducibility. `lineage` records every derivation.
3. **Research consumption (L3–L4).** Experiments request features **as-of** a timestamp via `pit_engine` — they _cannot_ see the future. Factors are engineered, hygiene-processed, orthogonalized, and characterized.
4. **Adjudication (L5).** Candidates run the gauntlet on **in-sample** data; only at the final gate is the **OOS vault** touched (once, audited). Verdicts are immutable.
5. **Simulation (L6).** Passed factors are backtested with realistic costs/impact/capacity on the simulated clock, producing reproducible artifacts.
6. **Construction (L7).** Validated alphas + risk models → optimized, cost-aware, constrained target portfolios.
7. **Execution (L8).** Targets become orders — **paper by default**, live only under a governance token. Fills update the authoritative ledger.
8. **Feedback (Evaluation + L9).** TCA and live results flow to `evaluation/`, which calibrates the sim-to-real gap back into L6 cost models and writes lessons into `memory/`. Governance monitors and can halt at any point.

**Golden rule of data flow:** it is unidirectional for _truth_ (raw→validated) and separately unidirectional for _learning_ (outcomes→memory→better research). The research side pulls data through the PIT firewall; it never reaches around it.

---

## 4. Research Flow (The Scientific Method, Automated)

This is the loop that makes it a _research OS_:

```
   ┌──────────────────────────────────────────────────────────────┐
   │                                                              ▼
DISCOVER ──► HYPOTHESIZE ──► PRE-REGISTER ──► ENGINEER ──► VALIDATE ──► BACKTEST
(data/lit)   (generator)     (success crit.  (factors)   (gauntlet,   (realistic)
                              BEFORE results)              deflation,
                                                           OOS gate)
                                                              │
   ┌──────────────────────────────────────────────────────────┤
   ▼                                                          │
CONSTRUCT ──► DEPLOY(paper) ──► MEASURE ──► LEARN ──► PRIORITIZE ──► (loop)
(portfolio)   (execution)      (evaluation) (memory,  (research_
                                            post_mortem) director)
```

1. **Discover.** `source_scout`, `literature_miner`, `company_researcher` surface raw ideas and data.
2. **Hypothesize.** `hypothesis_generator` states a falsifiable claim + economic rationale. Registered immutably.
3. **Pre-register.** `experiment_designer` fixes the test plan and success threshold _before_ any result exists. The global test counter increments.
4. **Engineer.** `factor_author`/`factor_search` build the signal; hygiene + orthogonalization applied.
5. **Validate.** The `skeptic` and validation agents run the gauntlet, deflate for multiple testing, and only then consult the OOS vault. Verdict issued.
6. **Backtest.** Realistic simulation + capacity.
7. **Construct & deploy.** Portfolio built; deployed to **paper** first.
8. **Measure & learn.** `evaluation/` grades it; `post_mortem` writes lessons; contradictions resolved by the curator.
9. **Prioritize.** `research_director` reads productivity metrics and memory to choose the _next_ most promising research — closing the loop and improving where the factory aims its effort.

The key discipline: **pre-registration + multiple-testing accounting + a sealed OOS vault** — three interlocking controls that make automated, high-throughput research statistically honest instead of a false-discovery firehose.

---

## 5. Agent Communication

**Model: event-driven, artifact-mediated, contract-typed. No direct agent-to-agent calls. No shared mutable state.**

- **Bus, not calls.** Agents publish/subscribe on `platform/message_bus`. An agent emits an event ("HypothesisProposed", "FactorReadyForValidation"); the orchestrator routes it to the right consumer. This decouples agents completely — any agent can be replaced or scaled without another knowing.
- **Artifacts, not payloads.** Messages carry _references_ to immutable artifacts in the registry, not fat payloads. "Validate factor `f:abc123`" — the validator fetches the exact, versioned artifact. This guarantees everyone reasons about identical, reproducible objects.
- **Contracts, always.** Every message and every agent's I/O conforms to `contracts/`. An agent is a black box defined solely by its input contract, output contract, and single responsibility.
- **Orchestrated routing.** `orchestration/router` uses `agents/registry` to match tasks to capable agents by capability, priority, and budget. Multiple instances of an agent share a queue for horizontal scale.
- **Blackboard for collaboration.** When several agents contribute to one problem (e.g., generator proposes, critic interprets, skeptic attacks), they collaborate via a shared _immutable-append_ blackboard artifact (the hypothesis's `research_graph` node), not by messaging each other. Each writes its own contribution; none overwrites another's.
- **Sagas for multi-step work.** Long processes (onboard-new-asset, full-validation-campaign) run as sagas with compensation, coordinated by `orchestration/saga_coordinator`, so partial failures roll back cleanly.
- **Human-in-the-loop as first-class participants.** Approval gates in `governance/` and `interfaces/` are just special "agents" that emit authorization events. A promotion to live capital is an event a _human_ must sign.

**Why this shape:** it enforces your one-agent-one-job rule at the communication layer. Because agents never call each other directly and never share state, no agent can quietly absorb a second responsibility or corrupt another's work. Auditability, replaceability, and scale all follow from bus + immutable artifacts + contracts.

---

## 6. Memory Architecture

A **four-tier cognitive memory** (working / episodic / semantic / procedural) over a **dual index (vector + knowledge graph)**, with **curation, provenance, and access control**.

| Tier           | Holds                                      | Lifespan                | Analogy               |
| -------------- | ------------------------------------------ | ----------------------- | --------------------- |
| **Working**    | in-flight task context                     | seconds–minutes         | short-term scratchpad |
| **Episodic**   | timeline of runs, decisions, outcomes      | permanent (append-only) | "what happened"       |
| **Semantic**   | distilled market beliefs, factor knowledge | curated/decaying        | "what we know"        |
| **Procedural** | proven playbooks/workflows                 | curated                 | "how we do it"        |

- **Dual retrieval.** `vector_index` for fuzzy semantic recall over corpora; `knowledge_graph` for precise relational/causal queries (entity → factor → outcome). Agents query through `memory_api` with scope and provenance.
- **Curation is active.** `memory_curator` consolidates duplicates, decays stale beliefs, and — critically — **detects and resolves contradictions**. An automated research engine will otherwise conclude "X predicts returns" and "X doesn't" in the same corpus; the curator surfaces and adjudicates these (often escalating to human/governance).
- **Provenance everywhere.** Every memory item records which run/agent/dataset produced it, and at what `knowledge_time`. This makes memory _auditable_ and lets you invalidate everything downstream of a discovered data bug.
- **Firewalls extend into memory.** The OOS access ban is enforced in `memory_api`: research agents cannot recall OOS-derived facts. Governance-scoped memories aren't readable by research agents. Memory respects the same walls as data.
- **Agents are stateless; the fund's mind is the memory fabric.** This keeps agents replaceable and makes the institution's accumulated intelligence a single, inspectable, governable asset — the compounding moat.

**Relationship to `knowledge/`:** `memory/` is the living, decaying cognitive substrate agents think with; `knowledge/` is the curated, citable, published corpus (dossiers, ontologies, reports). Beliefs graduate from semantic memory into the knowledge corpus once durable.

---

## 7. Task Orchestration

**A durable, budgeted, event-and-dependency-driven DAG engine that turns many single-purpose agents into a coordinated institution.**

- **Workflows as durable DAGs.** Every process — daily data pipeline, a research campaign, an asset onboarding — is a versioned DAG in `task_graph`. `workflow_engine` executes them durably and resumably (a crash mid-campaign resumes, not restarts).
- **Three trigger modes.** Time-based (nightly ingestion, weekly rebalance), event-based (new data → re-run dependent factors), and dependency-based (factor validated → enqueue backtest). The `scheduler` unifies these.
- **Capability routing.** Tasks are typed by required capability; the `router` dispatches to matching agents via the registry. Priority queues ensure high-value research preempts low-value churn.
- **Budget governance & backpressure.** `budget_governor` enforces compute/cost ceilings (an automated factory that generates thousands of hypotheses must not spend unboundedly). When budgets tighten, backpressure throttles idea generation before it floods validation — protecting both cost _and_ statistical integrity (fewer trials → less deflation needed).
- **The research agenda is itself orchestrated.** `research_director` (meta-agent) continuously re-prioritizes the queue based on `evaluation/` productivity metrics and `memory/` — the system decides _what to research next_, autonomously, within governance bounds.
- **Sagas + compensation.** Multi-step, cross-layer operations use compensating actions so failures leave the system consistent (a failed live-promotion cleanly reverts to paper).
- **Everything is recorded.** `run_ledger` immutably logs every task run — inputs, outputs, cost, duration, agent, outcome — feeding `evaluation/` and reproducibility.

**The orchestration philosophy:** the system is a self-directing research institution. Humans set mandate, budget, and risk limits (via `governance/` and `interfaces/`); the orchestrator + meta-agents allocate the fund's _cognitive labor_ toward the highest-expected-value research, continuously, safely, and reproducibly.

---

## 8. Cross-Cutting Invariants (The Rules That Never Bend)

These hold across every layer and are enforced structurally (identity, contracts, clock), not by discipline:

1. **Immutability.** Artifacts are never mutated, only superseded. Full history always reconstructable.
2. **Point-in-time correctness.** All research reads via the PIT engine on the injected clock. Wall-clock access during simulation is architecturally impossible.
3. **Reproducibility.** Every result = `(code version + data snapshot + config)`, all content-addressed. Any backtest reproduces exactly, forever.
4. **Separation of powers.** Generation ≠ adjudication (research vs validation). Alpha discovery ≠ alpha capture (research vs portfolio). Action ≠ oversight (execution vs governance). Each firewall is enforced by identity/RBAC.
5. **One agent, one job.** Enforced by the bus + contracts; no agent can absorb a second responsibility.
6. **OOS sanctity.** The out-of-sample vault is sealed from the research/factor/memory side. Access is rationed and audited.
7. **Human-gated consequences.** Live capital, capital increases, and overrides of automated blocks require human sign-off.
8. **Asset-agnostic core.** No core module branches on asset class; all specifics live behind `asset_adapters/contract`.
9. **Provenance-required.** Every artifact and memory carries its lineage. Discover a data bug → invalidate everything downstream automatically.

---

## 9. How This Scales From Day 1 to Institution

- **v0 (Foundations):** `platform/` + `contracts/` + `data_ingestion/` + `data_semantic/` for **US equities only**, plus the `backtesting/` core and a manual research loop. Prove PIT correctness and reproducibility first — everything else is worthless without them.
- **v1 (The Factory):** Add `research_engine/`, `factor_engineering/`, `validation/`, and the first agents (generator, skeptic, designer). Now hypotheses flow through the gauntlet automatically.
- **v2 (The Institution):** Add `portfolio/`, `execution/` (paper), `governance/`, `evaluation/`, and the memory fabric + orchestration meta-agents. Now it self-directs and self-assesses.
- **v3 (Expansion):** Add asset adapters one at a time — ETFs, Turkish equities, crypto, futures, options, macro, alt-data. **Each is one adapter; the core never changes.**
- **v4 (Live):** Governance-gated promotion from paper to live, per strategy, with TCA continuously tightening the sim-to-real gap.

Each stage is independently valuable and rests on the immutable foundations of the last. Nothing about adding crypto in v3 forces a rewrite of the equity research done in v1 — that is the whole point of the modular, contract-driven, adapter-based design.

---

## 10. Summary: Why This Is a Research OS, Not a Bot

A trading bot is Layers 7–8 with a hardcoded signal. This architecture makes those layers the _smallest, most downstream_ part of the system. The mass of the design is in:

- **Truth infrastructure** (PIT, bitemporal, reproducibility, lineage) — so results are trustworthy.
- **A hypothesis factory** (research engine + factor engineering + agent mesh) — so alpha is _discovered_, continuously and at scale.
- **An institutional adversary** (validation, deflation, OOS vault) — so discovered alpha is _real_, not overfit.
- **A learning loop** (memory fabric + evaluation + meta-agents) — so the system _improves how it does research_, not just what it trades.
- **Independent governance** — so autonomy never outruns safety.

The output is not trades. The output is **validated knowledge, with an unbroken evidence trail**, produced by a self-improving institution of single-purpose agents — exactly what a research organization at the level of Renaissance, Two Sigma, or Citadel is built to do.

---

**Next step when ready:** (a) ratify the cross-cutting invariants in §8 as ADRs in `docs/`, then (b) specify the `contracts/` for the core artifacts (Hypothesis, Factor, Verdict, Backtest, Portfolio) — because those schemas are the "waist of the hourglass" that everything else plugs into.
