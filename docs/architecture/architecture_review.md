# Architecture Review — AI Hedge Fund Research Operating System

### Independent Principal Quant Architect Audit

**Reviewer stance:** external, adversarial, no ownership of prior decisions.
**Assumption:** this system must survive 10+ years and eventually steward billions in AUM.
**Verdict headline:** strong _narrative_, dangerously _underspecified engineering_. This is an architecture diagram wearing an institution's clothes. Score at bottom.

---

# Executive Summary

The submission is an impressive **document**, not yet a credible **system**. It reads like it was designed by someone who has read the right papers (López de Prado on backtest overfitting, PIT/bitemporal data, separation of powers) and assembled the correct _vocabulary_, but has not yet been punished by production. The layering is clean, the folder taxonomy is coherent, and the statistical-defense instinct (OOS vault, deflation, multiple-testing registry) is genuinely above average for a first draft.

But an uncompromising read exposes a consistent failure mode: **the hard problems are named, then declared solved by naming them.** "Point-in-time correctness is enforced structurally" appears as a slogan repeated ~8 times, yet there is no mechanism specified that actually enforces it. "Immutability" is asserted but the leakage vectors (feature store recomputation, symbology remapping, restated fundamentals) are never addressed. "One agent, one responsibility" is stated as a law while the agent roster contains obvious multi-responsibility agents and obvious missing ones.

The three deepest structural weaknesses:

1. **The PIT/leakage guarantee is aspirational, not architectural.** The single most important property of a research OS — that you cannot see the future — is asserted but not designed. There is no vintage/as-of enforcement mechanism, no leakage test harness, no proof obligation on any consumer. This alone disqualifies it from institutional grade.
2. **The statistical-integrity accounting is naive and gameable.** A global "count of tests" is not a defense against p-hacking; it's a number that will be quietly reset, forked, or ignored the moment it becomes inconvenient. Real multiple-testing control requires a _pre-registered, immutable trial ledger with a family-wise/FDR budget that is enforced at the validation gate and cannot be bypassed by re-running under a new hypothesis ID._ That mechanism does not exist here.
3. **The agent mesh is a liability, not an asset.** Wrapping deterministic quantitative operations (validation, optimization, risk) in LLM "agents" introduces non-determinism, prompt-injection surface, and reproducibility holes into the exact places that must be deterministic. Several proposed agents should never exist. The architecture confuses "autonomy" with "LLM in the loop."

This system is roughly **50–60% of the way to a defensible design on paper and ~15% of the way to something you could trust with capital.** Detailed findings follow.

---

# Critical Issues

_(Critical = will cause capital loss, silent scientific fraud, or catastrophic failure. Must be fixed before a single dollar, real or paper, flows.)_

### C1. Point-in-time correctness is undesigned

The doc repeats "structurally impossible to see the future" as a mantra but specifies **no enforcement primitive**. Concretely missing:

- No **vintage model** for restated data. Fundamentals get restated; a company's "reported" Q3 revenue on the day it was announced differs from the value after the 10-K restatement. `bitemporal_writer` stamps `knowledge_time`, but nothing forces every downstream feature computation to _filter on it_. A single `SELECT * without an as-of predicate` reintroduces lookahead, and nothing prevents it.
- No **leakage test harness.** There is no adversarial process that deliberately tries to detect future-information contamination (e.g., train a model to predict the as-of timestamp from the feature vector; if it can, you're leaking). Layer 5 attacks _factors_; nothing attacks the _data pipeline itself_.
- The `feature_store` is described as "versioned" but feature **recomputation** is the classic leakage vector: recompute a feature today with today's code over historical data and you silently bake in future-aware logic (e.g., a normalization constant fit on the whole sample). No mechanism enforces that features are computed only from data available at each point's `knowledge_time`.
- **`entity_graph`, `symbology`, and `universe` are all lookahead landmines.** Sector classifications, index membership, and ticker mappings are themselves time-varying and routinely applied retroactively. The doc treats these as static reference data.

**This is the number-one reason institutional research dies, and the architecture's defense against it is a slogan.**

### C2. Multiple-testing control is a decorative counter, not a budget

`research_engine/multiple_testing` "maintains the global count of hypotheses tested." This is theater:

- A counter does not constrain anything. There is no **enforced statistical budget** (family-wise error rate / FDR allocation) that the validation gate checks against and _refuses_ to pass a factor when the budget is exhausted.
- It is trivially gamed: re-run the same idea under a new hypothesis ID, "explore" without registering, or fork the registry per researcher/agent. With an automated hypothesis-generation agent producing thousands of candidates, the deflation math becomes meaningless unless _every generated candidate — including the silently discarded ones — is counted._ Nothing forces that.
- Deflated Sharpe requires the number of _independent_ trials, which requires modeling the correlation structure of the trials. A raw count over-penalizes correlated variants and under-penalizes genuinely independent bets. Not addressed.

### C3. LLM agents in deterministic critical paths

The architecture routes non-deterministic LLM agents into places that must be bit-for-bit reproducible and auditable:

- `overfitting_auditor`, `robustness_examiner`, `risk_supervisor`, `allocation_strategist`, `risk_analyst` — these imply LLM judgment over statistical/portfolio outputs. **A hedge fund cannot have an LLM "judge" PBO risk or "recommend halts."** These must be deterministic, versioned, testable computations. An LLM narrating them is fine; an LLM _deciding_ them is a control failure and a reproducibility hole.
- Prompt-injection surface: `literature_miner` and `company_researcher` ingest untrusted external text (filings, news, web). If their output feeds hypothesis generation or memory without a trust boundary, adversarial text in a filing or news article can steer research or poison memory. No trust/quarantine model for agent-ingested content exists.

### C4. No reproducibility spine that actually binds

Reproducibility is claimed as `(code version + data snapshot + config)`, but:

- **LLM agents break it.** Same prompt + same model version ≠ same output (temperature, model drift, provider-side changes). Any artifact whose lineage includes an agent is _not_ reproducible under the stated definition. The architecture never reconciles "everything is reproducible" with "LLM agents produce artifacts."
- **No environment/dependency capture.** Numerical results depend on BLAS versions, library versions, RNG seeds, hardware (GPU non-determinism). "Code version" is insufficient. There's no mention of hermetic builds or seed capture.
- **Data snapshot ≠ data provenance under restatement.** If a vendor restates history, "the snapshot" is ambiguous unless snapshots are bitemporal too. Not specified.

### C5. Risk and governance are architecturally downstream of research, and that's backwards for the failure that matters

Governance is drawn as Layer 9 "on top," but the real risk in a _research_ institution is not a rogue trade — it's a **corrupt discovery** propagating into capital. There is no **pre-capital scientific governance**: no independent replication requirement, no mandatory holdout controlled by a party with no incentive to pass the factor, no sign-off that the _research_ (not the trade) is sound. Governance guards the execution door but leaves the laboratory door wide open.

### C6. The OOS vault firewall is under-specified and probably unenforceable as described

"Research agents architecturally cannot touch the OOS vault, enforced by RBAC." Problems:

- Humans design the pipeline that eventually runs on OOS. **Iterative leakage** ("I ran OOS, it failed, I tweaked the factor, I ran OOS again") is the actual way OOS vaults die, and RBAC does nothing against it. There is no _budget on OOS touches_, no one-shot enforcement, no burning of the OOS segment after use.
- With only one OOS vault, after ~dozens of final tests the OOS is contaminated for the whole institution and there is no described process for **rolling/replenishing** it (e.g., walk-forward embargoed folds, purged cross-validation). This is a single-use resource treated as reusable.

---

# Major Weaknesses

### M1. Single-responsibility is asserted, then violated

Concrete violators in the proposed design:

- **`data_semantic/` is a god-layer.** It owns feature store, PIT engine, universe, calendars, entity graph, lineage, _and_ the data catalog. That's five different services with different scaling profiles and owners. The entity graph alone is a product.
- **`research_engine/` mixes idea intake, literature, experiment design, the multiple-testing ledger, the research DAG, and the decision log.** The statistical trial ledger (C2) is a compliance-grade control and must be its own isolated, append-only service — not co-located with brainstorming intake.
- **`hypothesis_generator` agent** proposes hypotheses _and_ (implicitly) selects which features/economic rationale to attach — that's generation + framing, two jobs.
- **`portfolio_manager` meta-agent** "synthesizes what the fund does" — an unbounded responsibility that overlaps allocation, risk, and governance.
- **`platform/` bundles clock, identity, bus, compute, storage, secrets, observability** — fine as a layer name, but treated as one folder it hides that these are independent platform teams.

### M2. Over-generic modules that will collapse under real requirements

- **`asset_adapters/contract`** pretends one interface spans equities, options, futures, crypto, macro, and alt-data. It cannot. Options need an entire vol-surface/greeks/expiry/margin subsystem; futures need roll/continuous-contract construction and calendar-spread logic; crypto needs on-chain data, 24/7 sessions, exchange-idiosyncratic fee/rebate tiers, and custody/settlement risk; macro/alt-data are _not tradable at all_ and don't belong behind a trading adapter. Forcing these into one contract will produce a lowest-common-denominator interface that leaks asset specifics into the core anyway — the exact coupling it claims to prevent.
- **`optimizer/`** as a single module hides that mean-variance, risk-parity, robust/Bayesian, and hierarchical optimizers have incompatible input/uncertainty models. This will become a `if strategy_type == ...` swamp.
- **`market_model/` / `cost_model/`** are shared across asset classes but market impact in illiquid Turkish small-caps, options, and crypto perps have nothing in common. Genericity here directly corrupts backtest realism.

### M3. Hidden coupling the doc claims doesn't exist

- **The "unidirectional truth flow" is fiction.** Execution TCA feeds back into backtest cost models (L8 → L6), evaluation feeds memory which feeds research prioritization (feedback loops everywhere). These are _good_ loops but they are **not acknowledged as coupling**, so no one is managing their stability. A miscalibrated cost model from live TCA can silently degrade every future backtest — a feedback loop with no damping, no versioning of the calibration, no rollback.
- **Contracts as "the waist of the hourglass"** create a _global coupling point_: every schema change ripples to every layer. The versioning story ("backward/forward compatible") is hand-waved. In practice this becomes the single most contended, most political file set in the repo and the biggest source of cross-team blocking.
- **Memory feeding research prioritization** means a poisoned/contradictory memory silently biases _what gets researched next_. That's a coupling between data quality and research direction with no circuit breaker.

### M4. Backtest realism is described but the hardest parts are absent

- No mention of **borrow availability modeling over time** (shorting a name that wasn't actually shortable then), **hard-to-borrow fees**, or **short-squeeze/recall dynamics**.
- No **fill-probability model** conditioned on your own order relative to historical volume — "market impact" is listed but the _participation-rate feedback_ (your orders move the price you're modeling) is the actual hard problem.
- **Capacity model** is listed as a folder with no methodology; capacity is arguably the most important and most-faked number in institutional backtesting.
- No **survivorship handling for corporate actions in derivatives** (option chains around splits/mergers are a nightmare) — and the doc leans on options as a target asset.

### M5. Observability and cost governance for an autonomous LLM factory are absent

An automated system generating thousands of hypotheses will incur enormous compute/LLM spend and produce a firehose of artifacts. The doc has `budget_governor` and `observability` as folders, but:

- No **per-experiment cost attribution** or **ROI-of-research** accounting beyond a vague `research_productivity` metric.
- No story for **artifact explosion**: millions of immutable factor/backtest artifacts require lifecycle/tiering/GC policy. "Everything immutable forever" is a storage-cost time bomb at scale.
- No **model/agent drift monitoring**: when the underlying LLM is upgraded, every agent's behavior changes. Nothing tracks or gates this.

### M6. Security model is a single sentence

For a system that will hold alpha (the crown jewels) and eventually trade real money:

- No **threat model.** Insider exfiltration of factor definitions = the entire company value walking out the door. No mention of factor-definition access controls, watermarking, or exfil detection.
- No **secrets rotation, key management, or broker credential isolation** beyond "secrets/ folder."
- No **supply-chain security** for the many data connectors and Python dependencies.
- **Prompt injection / data poisoning** (C3) is a security issue treated nowhere.
- No **audit-trail tamper-evidence design** (it's asserted "tamper-evident" with no mechanism — append-only? hash-chained? external anchoring?).

### M7. Human-in-the-loop is a bottleneck with no design

"Humans sign off on promotions and overrides" — but an automated factory producing hundreds of candidate strategies will overwhelm any human gate. Either humans become rubber stamps (defeating the control) or the throughput collapses. There's no **tiered autonomy model** (which decisions are fully automated vs. escalated), no **sampling/audit** approach, no rate model. The governance gate is a serialization point that will either be bypassed culturally or throttle the whole institution.

---

# Missing Components

Responsibilities that are simply absent and are non-negotiable for a 10-year institution:

1. **Vintage/As-Of Data Service** (separate from feature store) — the authoritative bitemporal query layer that _every_ consumer must go through, with query-level enforcement that no un-as-of'd read is possible.
2. **Leakage Test Harness** — adversarial detection of future-information contamination in features and pipelines (predict-the-timestamp test, target-leakage scans).
3. **Immutable Trial Ledger + Statistical Budget Enforcer** — the real version of C2: every trial (including discarded ones) counted, correlation-aware, with an enforced FWER/FDR budget the validation gate obeys.
4. **Independent Replication Service** — before any factor reaches capital, a _separate_ code path (ideally different implementation) must reproduce the result. No single-implementation discoveries.
5. **Holdout/Embargo Manager** — manages purged, embargoed, walk-forward folds and a _replenishable_ OOS resource with a strict, budgeted, one-shot access protocol (fixes C6).
6. **Factor Decay & Retirement Service** — the doc mentions decay analytics but has **no lifecycle to retire a factor** whose alpha has decayed or crowded out. Alpha rots; nothing here kills dead factors in production.
7. **Regime Detection & Conditioning Lab** — regime analysis is a folder in validation but there is no first-class regime service that portfolio/risk/execution all condition on. Regimes belong across the stack, not buried in validation.
8. **Crowding / Capacity / Correlation-to-Peers Monitor** — is our "alpha" just everyone else's factor? No mechanism to detect that the edge is crowded (a top-tier fund's #1 practical concern).
9. **Rejected/Failed Research Database as a first-class, queryable asset** — the doc has a `decision_log` but treats failures as a byproduct. Failed research is _training data_ for meta-research and must be a structured, searchable corpus, not a log.
10. **Data-Quality SLA & Vendor-Restatement Handler** — what happens operationally when a vendor restates 5 years of history? No described reconciliation/invalidation cascade.
11. **Model/Agent Registry & Evaluation Harness** — which LLM/model version powers which agent, with a golden-set eval gate before any model upgrade reaches production agents.
12. **Explainability / Attribution Lab** — economic-rationale validation: does the factor have a defensible mechanism, or is it a data artifact? Attribution exists for backtests but not for _why a factor should work_.
13. **Disaster Recovery / Business Continuity design** — none. For a live-trading system this is mandatory (broker outage, exchange halt, data-feed loss mid-session).
14. **Time-series-correct CV framework** — purged k-fold / combinatorial purged CV (CPCV) is the standard defense against backtest overfitting and is nowhere named.
15. **Research-to-Production parity harness** — proof that the signal computed in research equals the signal computed in live (a classic source of silent P&L bleed).

---

# Statistical Risks

| Bias / risk                         | Addressed?            | Assessment                                                                                        |
| ----------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| **P-hacking**                       | Partially             | Counter exists (C2); enforcement does not. **Not prevented.**                                     |
| **Data leakage**                    | Claimed only          | No harness, no enforcement (C1). **Not prevented.**                                               |
| **Look-ahead bias**                 | Claimed only          | No as-of enforcement, restatement/vintage model absent (C1). **Not prevented.**                   |
| **Survivorship bias**               | Partially             | Universe survivorship mentioned; corporate-action/derivatives survivorship absent (M4). **Weak.** |
| **Multiple-testing bias**           | Naively               | Uncorrelated-count fallacy; discarded trials uncounted (C2). **Not controlled.**                  |
| **Reproducibility**                 | Claimed, contradicted | LLM agents + no env capture break it (C4). **Not achieved.**                                      |
| **Experiment versioning**           | Partially             | Immutable artifacts help; agent non-determinism undermines. **Partial.**                          |
| **Statistical auditing**            | Weak                  | Verdicts stored, but no independent statistical audit function, no replication. **Weak.**         |
| **Factor retirement**               | Missing               | No lifecycle to kill decayed/crowded factors (Missing #6). **Absent.**                            |
| **Hypothesis lifecycle**            | Decent                | Best-designed part of the system. **Adequate.**                                                   |
| **Failed research preservation**    | Weak                  | `decision_log` only; not a first-class corpus (Missing #9). **Weak.**                             |
| **Selection bias in the universe**  | Missing               | Index-membership/point-in-time universe drift under-addressed. **Absent.**                        |
| **Backtest overfitting (PBO/CSCV)** | Named only            | No CPCV, no purge/embargo (Missing #14). **Named, not built.**                                    |

**Net statistical verdict:** the architecture _knows the names of the biases_ and has built defenses for perhaps two of them at the design level, none at the enforcement level. For a scientific institution, this is failing.

---

# AI Architecture Risks

### Agents that should NOT exist (as decision-makers)

- **`overfitting_auditor`, `robustness_examiner`** — statistical adjudication must be deterministic code, not LLM judgment. Keep a _narrator_ agent that explains the deterministic verdict; kill the _judging_ agent.
- **`risk_supervisor` (recommending halts), `risk_analyst`, `allocation_strategist`** — risk limits and allocation are quantitative and must be deterministic and formally verifiable. An LLM must never sit in the risk-halt path.
- **`system_critic` auditing the OS itself** — an LLM agent auditing its own institution's process is governance theater; this is a human + formal-metrics function.

### Agents that overlap (SRP violations)

- `experiment_designer` exists **both** as a research-engine module _and_ as an agent — duplicated responsibility, unclear authority.
- `factor_critic` (interprets economics) vs `overfitting_auditor` vs `skeptic` — three agents with fuzzy, overlapping "is this factor real?" mandates and no crisp boundary.
- `research_director` (prioritizes) vs `portfolio_manager` meta-agent (synthesizes) vs `budget_governor` — three things arbitrating "what should we do next" with overlapping authority and no defined precedence.

### Agents that are missing

- **Data-poisoning / prompt-injection sentinel** for untrusted ingested text.
- **Replication agent** (independent re-derivation).
- **Crowding-detection analyst** (deterministic + narration).
- **Factor-retirement monitor.**

### Communication design flaws

- **Blackboard "immutable-append" collaboration** among generator/critic/skeptic is a nice idea but creates **implicit consensus with no arbiter**: who decides when the blackboard is "done" and what the verdict is? Undefined. Multi-agent debate without a formal aggregation rule produces mush.
- Agents that **should never communicate directly**: hypothesis generation and OOS/validation must be air-gapped (they can't be — see C6 iterative leakage). The bus makes it _easy_ for a generator to subscribe to validation outcomes and thereby _learn to overfit the validator._ This is a catastrophic, unaddressed feedback loop: **the generator will evolve to defeat the skeptic.** There is no mention of preventing the generator from training on validation feedback.
- **Should orchestration change?** Yes — see below.
- **Should memory change?** Yes — the memory fabric feeding both generation and prioritization, with no provenance-based trust weighting or contradiction quarantine, means bad conclusions compound. Memory needs _confidence decay_, _contradiction quarantine_, and _strict scoping_ so validation-derived knowledge never leaks back to generation.
- **Should planning change?** The `research_director` as an LLM meta-agent setting the research agenda is a single point of cognitive failure and bias amplification. Research prioritization should be a _transparent, auditable optimization_ (expected information gain vs. cost) with an LLM proposing, not deciding.

### The core AI misjudgment

The architecture treats "LLM agent" as the default unit of work. **It should be the exception.** The default unit should be a deterministic, versioned, testable function. LLMs belong at the _fuzzy edges_: reading literature, drafting hypotheses, writing human-readable narratives, proposing (not choosing) priorities. Everywhere else they inject non-determinism, cost, latency, and attack surface into places that must be deterministic. As drawn, ~60% of the agent roster is misplaced.

---

# Quant Research Risks

- **The generator-vs-validator arms race (restated because it's the deepest flaw):** any system where an idea-generating process receives feedback from the validating process will, over enough iterations, overfit the validator rather than the market. This is the automated-research version of a researcher who runs 10,000 backtests and reports the best. The architecture's whole premise (automated hypothesis generation + a validation gauntlet) _structurally invites_ this and has no defense. **This is the single most important quant risk and it is unaddressed.**
- **Economic priors are absent.** Great funds constrain the search space with economic reasoning to keep the multiple-testing burden survivable. This architecture lets a symbolic-search engine roam free over factor space, which maximizes false discoveries. There is no mechanism to require an _ex-ante economic hypothesis_ that meaningfully restricts the search.
- **Regime-dependence is treated as a test, not a truth.** Alpha is conditional; the architecture treats regime analysis as a checkbox in validation rather than a first-class conditioning variable across portfolio and execution.
- **No transaction-cost-aware alpha definition.** Alpha is discovered gross, then costs are applied later. Top funds define alpha _net_ from the start, because a gross signal that dies after costs was never alpha. The pipeline's ordering (discover → validate → then cost in backtest) will manufacture illusory factors.
- **Capacity and crowding — the two things that actually kill institutional alpha — are folders, not designs.**

---

# Scalability Risks

**What fails first under scale:**

1. **The `contracts/` waist.** As team count grows, the global schema becomes the primary blocking dependency. First organizational scaling failure.
2. **Immutable-everything storage.** Millions of factor/backtest artifacts with no tiering/GC = runaway storage cost and unqueryable artifact sprawl. First cost/operational failure.
3. **The PIT/as-of query engine.** As-of joins over bitemporal data at tick granularity across nine asset classes is the first _performance_ wall. The doc waves at "evolve to a temporal store" with no plan.
4. **Human approval gates (M7).** First _throughput_ failure — the factory outruns the humans.
5. **The single OOS vault (C6).** First _statistical_ scaling failure — exhausted within months of high-throughput research.
6. **LLM cost/rate limits.** A factory of agents generating thousands of hypotheses hits provider rate limits and budget ceilings fast; no backpressure design beyond a named folder.
7. **The message bus as universal spine.** Every artifact-reference event through one bus becomes a coordination and ordering bottleneck; no partitioning/domain-topic strategy described.

**What does NOT scale conceptually:** the "one giant coherent system" framing. A 10-year institution needs **bounded contexts with independent lifecycles**, not a single layered monolith with a shared contract waist and a shared memory fabric. The design is a distributed monolith in waiting.

---

# Technical Debt

- **Debt from genericity (M2):** the universal `asset_adapters/contract` and the monolithic `optimizer`/`cost_model` will accrete asset-specific special-cases until they are unmaintainable `if/else` swamps. **Impossible to maintain after ~3 years, let alone 5.**
- **Debt from LLM coupling (C3/C4):** every LLM in a critical path is a permanent reproducibility and testing liability that compounds with every model upgrade.
- **Debt from the contract waist (M3):** cross-cutting schema evolution with no real versioning discipline becomes migration hell.
- **Debt from "immutable forever" with no lifecycle:** unbounded artifact growth with no retirement is both storage debt and cognitive debt (nobody can find anything).
- **Debt from under-specified memory curation:** "resolve contradictions" and "decay stale beliefs" are hand-waved; in practice this becomes an ungoverned pile that silently steers research.
- **Debt from missing DR/BCP and security:** these are 10x more expensive to retrofit into a live system than to design in.
- **The biggest debt: the gap between the doc's confidence and its specification.** Every "enforced structurally" that is actually "we hope people do this" is a latent defect that will surface as a lookahead-bias scandal or a blown-up strategy years later.

---

# Proposed New Components

_(Design sketches — what must be added, not rewrites of what exists.)_

1. **As-Of Data Gateway (mandatory chokepoint).** No component may read data except through a gateway that requires an `as_of` timestamp and physically cannot return records with `knowledge_time > as_of`. Un-as-of'd reads are impossible, not discouraged. Includes vintage handling for restatements and time-varying reference data (sectors, index membership, symbology).
2. **Leakage Test Harness.** Automated, runs on every feature/factor: predict-the-as-of-timestamp test, target-leakage scan, train/test contamination checks. Blocks promotion on failure.
3. **Immutable Trial Ledger + Budget Enforcer.** Every trial (generated, discarded, run) is recorded append-only with its correlation cluster; the validation gate enforces a family-wise/FDR budget and refuses promotion when exhausted. Cannot be forked or reset.
4. **Independent Replication Service.** Second, isolated re-derivation (ideally alternate implementation) required before capital. Discrepancy = automatic rejection.
5. **Holdout & Embargo Manager.** Purged/embargoed walk-forward and CPCV folds; a budgeted, one-shot, audited OOS access protocol; automatic OOS replenishment/rotation policy.
6. **Factor Lifecycle & Retirement Service.** Live monitoring of decay/crowding/correlation-to-book; automatic flagging and governed retirement of dead factors. Alpha has a birth _and a death_.
7. **Regime Service (cross-cutting).** First-class regime state consumed by research, portfolio, risk, execution — not buried in validation.
8. **Crowding & Capacity Intelligence.** Detects when an edge is crowded (correlation to known factors/peer behavior, capacity erosion) and feeds sizing and retirement.
9. **Adversarial Isolation Barrier between generation and validation.** The generator must be _blind_ to validation internals and OOS feedback; only aggregate, delayed, budgeted signals may cross, to prevent validator-overfitting.
10. **Model/Agent Registry + Golden-Set Eval Gate.** Pins model versions per agent; no upgrade without passing a behavioral eval; tracks agent drift.
11. **Trust & Quarantine Layer for ingested text.** Untrusted external content (filings, news, web) is sandboxed; prompt-injection/poisoning sentinel; provenance-tagged before it can influence research or memory.
12. **Net-Alpha Definition from the start.** Cost/impact/borrow modeling injected at _discovery_, so no gross-only "alpha" ever enters the pipeline.
13. **Research-to-Production Parity Harness.** Proves live signal == research signal, continuously.
14. **DR/BCP & Trading-Halt Playbooks.** Feed-loss, broker-outage, exchange-halt, and kill-switch recovery designs.
15. **Explainability/Economic-Rationale Lab.** Requires and evaluates a defensible economic mechanism per factor before promotion.

---

# Proposed Removed / Demoted Components

- **Remove LLM decision authority from:** `overfitting_auditor`, `robustness_examiner`, `risk_supervisor`, `risk_analyst`, `allocation_strategist`. Convert to deterministic engines with optional _narrator_ agents. (Don't remove the function — remove the LLM from the decision.)
- **Remove `system_critic` LLM agent.** Replace with human review + formal meta-metrics.
- **Collapse duplicate `experiment_designer`** (module vs agent) into one authority.
- **Demote the universal `asset_adapters/contract`.** Split into _capability contracts_ (market-data, tradability, cost, corporate-actions, risk) that asset classes implement à la carte; non-tradable feeds (macro, alt-data) removed from the trading-adapter hierarchy entirely.
- **Demote the monolithic `optimizer`/`cost_model`/`market_model`** into per-regime/per-asset strategy implementations behind narrow interfaces.
- **Reconsider the single global `contracts/` waist** — decompose into per-bounded-context contracts with explicit, versioned inter-context translation, to break the global coupling point.
- **Demote `memory` as a research-prioritization input** until confidence-weighting, contradiction quarantine, and scoping exist; today it's a poisoning vector.

---

# Priority Matrix

### CRITICAL (fix before any capital, real or paper)

- C1 As-Of/PIT enforcement + vintage model (New #1, #2)
- C2 Real multiple-testing budget + trial ledger (New #3)
- C6 Holdout/embargo one-shot protocol + OOS replenishment (New #5)
- Generator↔validator adversarial isolation (New #9) — the deepest quant flaw
- C3/C4 Remove LLMs from deterministic critical paths; reproducibility spine (New #10)
- Net-alpha-from-start (New #12)

### HIGH

- Independent replication service (New #4)
- Factor retirement + crowding/capacity intelligence (New #6, #8)
- Leakage test harness productionized (New #2)
- Security threat model, prompt-injection/poisoning quarantine (New #11, M6)
- Human-in-the-loop tiered-autonomy design (M7)
- Backtest realism gaps: borrow, fills, capacity methodology (M4)

### MEDIUM

- Regime service as cross-cutting (New #7)
- Split god-modules `data_semantic`, `research_engine` (M1)
- Decompose universal asset/optimizer/cost genericity (M2)
- Artifact lifecycle/tiering/GC (M5)
- Model/agent drift gating (New #10)
- Explainability/economic-rationale lab (New #15)

### LOW

- Contract-waist decomposition into bounded contexts (long-term org scaling)
- Failed-research corpus upgrade from log to queryable asset (Missing #9)
- Research-prioritization as transparent optimization vs LLM director
- DR/BCP formalization (LOW only because it's pre-live; becomes CRITICAL at go-live)

---

# Final Verdict

**This is a well-read architecture, not a battle-tested one.** It demonstrates genuine understanding of _what the problems are_ — PIT correctness, overfitting, separation of powers, reproducibility — and almost none of _how to actually enforce them_. The gap between its rhetorical confidence ("structurally impossible," "enforced by design") and its actual specification (folder names and slogans) is exactly the gap that, at an institution, manifests years later as a lookahead-bias blowup, a crowded-and-decayed book, or a silently overfit factory.

The three fatal-if-unfixed issues:

1. **PIT/leakage is undesigned** (a slogan, not a mechanism).
2. **Multiple-testing control is a decorative counter** that any researcher or agent can trivially evade.
3. **The automated generator will learn to defeat its own validator**, and nothing stops it.

The strongest aspects — hypothesis lifecycle, the _instinct_ toward an OOS vault and deflation, the separation-of-powers framing, the asset-agnostic ambition — are real and worth keeping. But they are 20% of the way to institutional grade, and the missing 80% is precisely the hard, unglamorous enforcement engineering that separates a design document from a system you can trust with a billion dollars.

### Score: **58 / 100**

Breakdown (institutional grade = 95+):

- Conceptual framing & vocabulary: 85/100
- Software architecture rigor: 55/100
- Data/PIT correctness (enforced): 30/100
- Statistical validity (enforced): 35/100
- AI/agent architecture: 45/100
- Risk/execution/governance depth: 45/100
- Security: 20/100
- Scalability (10-yr): 50/100
- Maintainability/extensibility: 50/100
- Reproducibility (real): 35/100

**A 58 means: promising skeleton, not investable.** It would pass a startup's design review and fail a Two Sigma / RenTec / Citadel architecture bar decisively. The path to 95+ is not more layers or more agents — it is **deleting LLMs from deterministic paths, and replacing every "enforced structurally" slogan with an actual enforcement mechanism that a motivated, clever researcher (or an optimizing agent) cannot bypass.** Until the enforcement exists, this is a beautifully organized way to fool yourself at scale.

**Recommendation:** do not proceed to implementation of Layers 4–8 until the CRITICAL tier is designed to the level of _mechanism and proof obligation_, not folder and slogan. Re-review after that redesign.
