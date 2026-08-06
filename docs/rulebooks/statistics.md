# Statistics & Statistical Integrity Rulebook

| Field             | Value                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **Rulebook ID**   | RB-01                                                                                           |
| **Code**          | `STAT` (rule ID prefix)                                                                         |
| **Tier**          | 3 (Rulebook)                                                                                    |
| **Owner**         | Head of Research / Chief Scientist (**HR**), co-signed by Governance & Risk Committee (**GRC**) |
| **Version**       | 1.0.0                                                                                           |
| **Status**        | PROPOSED (binding upon ARB ratification per Framework §10)                                      |
| **Last Ratified** | — (pending)                                                                                     |
| **Supersedes**    | —                                                                                               |

> **Reading note.** This rulebook is Tier-3 operational law. It is subordinate to `CLAUDE.md` (Constitution) and the Architecture Canon, and supreme over Agent Contracts, Workflow Contracts, and Source Code. It contains **rules**, not tutorials. It defines _what must statistically hold_; it never prescribes libraries, code, or implementation. Where a threshold is a **GRC-governed parameter**, its numeric default is institutional policy, changeable only by the amendment/waiver process in §Exceptions — not by any researcher, agent, or PR.

---

## 2. Purpose

To define the immutable statistical standards, governance, validation requirements, and promotion/rejection criteria that make every research claim on this platform honest, reproducible, and auditable. This rulebook is the single authority on **statistical significance, multiple-testing control, deflation, trial-correlation accounting, and statistical validity** (Framework §8 Single-Source-of-Truth Map). Every experiment, feature, factor, model, and portfolio claim MUST comply.

Its governing intent is the Constitution's central lesson (`CLAUDE.md` CP-1, philosophy §3; REVIEW): **a statistical guarantee that is asserted but not enforced is a defect.** Every rule here is written to be checkable by a deterministic system or an independent auditor.

## 3. Scope & Boundaries

**In scope (this rulebook is the authority):**

- Hypothesis testing standards, significance, and error control (FWER/FDR).
- Multiple-testing budgets and correlation-aware effective-trial accounting.
- Metric deflation and honest performance reporting.
- Statistical requirements for cross-validation, holdout, bootstrap, Monte Carlo, and time-series evaluation.
- Statistical definitions of, and required evidence against, the integrity threats (leakage, look-ahead, survivorship, selection, p-hacking, overfitting).
- Statistical acceptance, rejection, promotion evidence, and audit standards.

**Out of scope (this rulebook references, MUST NOT restate — per Framework RBK-A2, RBK-DUP-1):**

- **Orchestration/gating** of the validation gauntlet, one-shot holdout access, and replication execution → owned by **RB-04 · VAL** (`P2-05..P2-09`).
- **As-of reads, vintage, lineage, and the leakage test harness** → owned by **RB-08 · PIT** (`P1-01`, `P1-06`, `P2-03`).
- **Experiment records, manifests, and trial-ledger storage** → owned by **RB-03 · EXP** (`P2-01`, `P3-03`).
- **Reproducibility manifests and determinism capture** → owned by **RB-05 · REPRO** (`P1-02`).
- **Pre-registration and falsifiability process** → owned by **RB-02 · RMET** (`P3-02`).
- **Factor construction, orthogonalization mechanics, capacity/crowding** → owned by **RB-10 · FCTR**.
- **AI role boundaries** → owned by **RB-15 · AIGOV**.

STAT defines the **statistical correctness requirements** that these owners must satisfy; the owners define the **mechanism**. When this rulebook states a requirement over an out-of-scope mechanism, it does so as a _statistical acceptance condition_, and cites the owner.

## 4. Constitutional Basis (`CLAUDE.md`)

Every rule herein traces to at least one of: **SI-1..SI-5** (statistical integrity), **SM-1..SM-5** (scientific method), **EX-1..EX-4** (experiment management), **VS-1..VS-4** (validation), **RP-1..RP-4, CP-4** (reproducibility), **AI-2, DE-1** (no LLM significance judgments), **AD-1..AD-3** (net-alpha, economic rationale, generator↔validator isolation), and the Forbidden Practices **FB-6, FB-7, FB-8, FB-9, FB-10**. Anti-patterns mirror `CLAUDE.md` AP-1..AP-3, AP-6, AP-10.

## 5. Architectural Basis (Architecture Canon)

Grounded in: REVIEW critical findings **C1** (leakage), **C2** (multiple-testing counter), **C6** (OOS reuse), and the quant "generator-defeats-validator" flaw; PATCH patches **P2-01** (Trial Ledger), **P2-02** (Multiple-Testing Enforcer), **P2-03** (Leakage Harness), **P2-04** (Net-Alpha), **P2-05** (Holdout Manager), **P2-06** (Purged/Combinatorial CV), **P2-07** (Isolation Barrier), **P2-08** (Replication Engine), **P2-09** (Scientific Gate); ARCH **§2.6** (Validation layer) and **§8** (cross-cutting invariants).

## 6. Definitions

Constitutional terms (Alpha, As-Of Read, Deflated Metric, Holdout/OOS, Isolation Barrier, Manifest, Trial Ledger, Pre-Registration, etc.) are defined in `CLAUDE.md` Glossary and are **not** redefined here. Statistics-specific terms are defined in §Glossary at the end of this rulebook. Where a constitutional term and a statistical term collide, the constitutional definition governs.

---

# RULES

> Every rule below carries a stable ID (`STAT-n`), RFC 2119 force, and a rationale. Rules are grouped by the topical sections mandated for this rulebook. Numbering is continuous for durable citation.

## Philosophy

- **STAT-1 (MUST).** Research MUST be treated as adversarial toward its own conclusions: the default null is "this signal is noise," and the burden of proof lies entirely on the claim. _Rationale:_ the institution's two adversaries are self-deception and irreproducibility (`CLAUDE.md` philosophy; REVIEW). A permissive posture manufactures false discoveries at machine scale.
- **STAT-2 (MUST).** Every statistical claim MUST be reducible to evidence that an independent party can reproduce and re-judge without consulting the claimant. _Rationale:_ SI, CP-4, CP-7 — auditability is non-negotiable.
- **STAT-3 (MUST NOT).** No statistical conclusion MAY depend on a human's or an LLM's discretion at the moment of judgment; the decision rule MUST be fixed beforehand and executed deterministically. _Rationale:_ AI-2, DE-1; discretion at judgment time is the mechanism of p-hacking and bias.
- **STAT-4 (SHOULD).** Simpler models and fewer parameters SHOULD be preferred when predictive evidence is comparable. _Rationale:_ parsimony reduces overfitting surface and improves out-of-sample durability.

## Statistical Principles

- **STAT-5 (MUST).** Every test MUST have its null hypothesis, alternative, directionality (one/two-sided), test statistic, and decision threshold **pre-registered and frozen** before any evaluation on data (owned by RB-02 · RMET; `P3-02`). _Rationale:_ SM-2, FB-8.
- **STAT-6 (MUST).** All reported statistics MUST be accompanied by uncertainty (interval or posterior) and the effective sample size used. A point estimate without uncertainty is inadmissible as evidence. _Rationale:_ point estimates conceal fragility.
- **STAT-7 (MUST).** Statistical significance MUST NOT be conflated with economic significance; a result MUST report effect size and net-of-cost economic magnitude alongside significance. _Rationale:_ SI, AD-1; statistically significant, economically trivial signals waste capital and multiple-testing budget.
- **STAT-8 (MUST NOT).** A hypothesis MUST NOT be altered after seeing results and then presented as if pre-registered. Any change creates a new hypothesis with a new trial-ledger entry. _Rationale:_ SM-2, FB-8, EX-3.

## Research Validity

- **STAT-9 (MUST).** A claim is valid only if it satisfies, jointly: internal validity (no leakage/bias), statistical validity (correct inference under multiplicity), and external validity (robustness across subperiods, sub-universes, and regimes). Failing any one voids the claim. _Rationale:_ VS-\*, REVIEW C1/C2.
- **STAT-10 (MUST).** Threats to validity (§Survivorship/Look-Ahead/Data Leakage/Selection/Confirmation Bias) MUST be explicitly enumerated and evidenced as controlled for each experiment; silence is treated as an unmet threat. _Rationale:_ CP-1 (enforcement over intention).

## Scientific Method

- **STAT-11 (MUST).** The statistical portion of every research effort MUST follow: pre-register → freeze decision rule → enroll trial in ledger → evaluate → deterministically judge → record verdict, in that order, with no backward edits. _Rationale:_ SM-1..SM-5.
- **STAT-12 (MUST).** Negative and null results MUST be recorded with the same rigor and permanence as positive results (owned corpus: RB-02 · RMET / `P3-05`); they remain part of the multiple-testing accounting. _Rationale:_ SM-4; discarding failures corrupts FDR/FWER math (REVIEW C2).

## Experiment Registration (statistical metadata)

- **STAT-13 (MUST).** Before execution, every experiment's statistical plan — hypotheses, thresholds, CV scheme, embargo, deflation method, and the research family it belongs to — MUST be recorded immutably in the Experiment Registry and linked to a Trial-Ledger entry (owned by RB-03 · EXP; `P2-01`, `P3-03`). _Rationale:_ EX-1, EX-4; unregistered trials break multiplicity control (FB-5, FB-8).
- **STAT-14 (MUST).** Every candidate evaluated — including those silently discarded during exploration — MUST increment the Trial Ledger for its family. _Rationale:_ SI-1; uncounted trials render deflation meaningless (REVIEW C2). This is the difference between a counter and a control.

## Hypothesis Testing

- **STAT-15 (MUST).** Each hypothesis MUST specify a single primary endpoint. Secondary endpoints MUST be pre-registered and counted against the multiple-testing budget. _Rationale:_ undeclared secondary endpoints are a classic p-hacking vector.
- **STAT-16 (MUST).** The decision rule MUST be expressed as a deterministic predicate over pre-registered thresholds, evaluated by a deterministic engine (RB-04 · VAL; DE-1). _Rationale:_ STAT-3.
- **STAT-17 (SHOULD).** Where the sampling distribution is unknown or non-normal, distribution-free or resampling-based tests (§Bootstrap, §Monte Carlo) SHOULD be used in preference to parametric tests relying on unverified assumptions. _Rationale:_ financial data violate i.i.d./normality routinely.
- **STAT-18 (MUST).** All test assumptions (independence, stationarity, distributional form) MUST be stated and checked; a test whose assumptions are violated and unaddressed is inadmissible. _Rationale:_ invalid assumptions invalidate the p-value.

## Multiple Testing Control

- **STAT-19 (MUST).** Multiple-testing control MUST be **enforced** by a deterministic budget gate over the immutable Trial Ledger (RB-04 · VAL executes; `P2-01`, `P2-02`). A promotion whose significance does not survive the budget MUST be refused. _Rationale:_ SI-1; a global counter is not a control (REVIEW C2, AP-2).
- **STAT-20 (MUST).** Every trial MUST be assigned to a declared **research family**; the error budget is allocated and consumed per family. Cross-family reuse of an exhausted budget is PROHIBITED. _Rationale:_ families bound the multiplicity correction to a coherent scientific question.
- **STAT-21 (MUST).** The correction MUST use the **correlation-aware effective number of trials**, not the raw count (§Trial Correlation, STAT-24). _Rationale:_ SI-2; a raw count over-penalizes correlated variants and under-penalizes independent bets.
- **STAT-22 (MUST NOT).** A researcher or agent MUST NOT reset, fork, or bypass the Trial Ledger to obtain a fresh budget. Detected circumvention voids all affected claims. _Rationale:_ SI-1, FB-8.

### Decision table — which multiplicity control applies

| Situation                                                                        | Required control                          | Rule             |
| -------------------------------------------------------------------------------- | ----------------------------------------- | ---------------- |
| Small, fixed set of confirmatory hypotheses; false positive is costly            | Family-Wise Error Rate (FWER)             | STAT-27          |
| Large-scale screening/discovery; many candidates; some false positives tolerable | False Discovery Rate (FDR)                | STAT-25          |
| Correlated variants of one idea                                                  | Effective-trials adjustment then FWER/FDR | STAT-21, STAT-24 |
| Sequential/adaptive testing over time                                            | Alpha-spending / always-valid inference   | STAT-23          |

- **STAT-23 (MUST).** Sequential or adaptive testing (repeated looks at accumulating data or repeated OOS evaluation) MUST use an alpha-spending or always-valid inference scheme registered in advance; naive repeated testing at fixed alpha is PROHIBITED. _Rationale:_ repeated looks inflate Type-I error; this is the statistical root of OOS-vault contamination (REVIEW C6).

## False Discovery Rate (FDR)

- **STAT-24 (MUST).** For discovery-scale research (many simultaneous candidates), the platform MUST control FDR at a **GRC-governed default of q ≤ 0.10** using a procedure valid under the observed dependence structure of the trials. _Rationale:_ SI-1/SI-2; controlling expected false-discovery proportion is the appropriate error rate for screening.
- **STAT-25 (MUST).** FDR estimates MUST account for trial correlation; independence-assuming procedures MUST NOT be used when trials are correlated. _Rationale:_ SI-2.
- **STAT-26 (SHOULD).** Realized FDR SHOULD be tracked over time via Research Scorecards (RB-13 · reference; `P3-13`) and reconciled against the target. _Rationale:_ CI-1; drift between target and realized FDR indicates a broken control.

## Family-Wise Error Rate (FWER)

- **STAT-27 (MUST).** For confirmatory research where any single false positive is unacceptable (e.g., a factor entering production capital), FWER MUST be controlled at a **GRC-governed default of α ≤ 0.05** across the family, after effective-trials adjustment. _Rationale:_ production capital demands the stricter error rate.
- **STAT-28 (MUST).** The transition from discovery (FDR-controlled) to confirmation (FWER-controlled) MUST occur before capital eligibility and MUST be recorded. _Rationale:_ SI, RG-1; discovery-grade evidence is insufficient for capital.

## Bayesian vs Frequentist Guidelines

- **STAT-29 (MAY).** Bayesian and frequentist methods MAY both be used; the chosen framework MUST be pre-registered per hypothesis and MUST NOT be switched after seeing results. _Rationale:_ framework-shopping is p-hacking (FB-8).
- **STAT-30 (MUST).** Bayesian analyses MUST pre-register priors with justification; priors MUST NOT be tuned to produce a desired posterior. Sensitivity to prior choice MUST be reported (§Sensitivity Analysis). _Rationale:_ undisclosed prior tuning is confirmation bias.
- **STAT-31 (MUST).** Whichever framework is used, the multiplicity of trials MUST still be accounted for (Bayesian analyses via appropriate hierarchical/shrinkage modeling or explicit trial accounting). _Rationale:_ SI-1 applies regardless of inferential philosophy.
- **STAT-32 (MUST NOT).** A Bayesian framing MUST NOT be used to evade multiple-testing accounting on the grounds that "Bayesians don't correct for multiplicity." _Rationale:_ the institutional risk (false discovery reaching capital) is framework-independent.

## Confidence Intervals

- **STAT-33 (MUST).** Every effect estimate MUST report an interval (frequentist CI or Bayesian credible interval) at a pre-registered level (**GRC default 95%**). _Rationale:_ STAT-6.
- **STAT-34 (MUST).** Intervals for time-series/performance statistics MUST be computed by methods that respect serial dependence (e.g., block/stationary bootstrap; §Bootstrap), not methods assuming i.i.d. observations. _Rationale:_ naive intervals are far too narrow under autocorrelation, overstating confidence.
- **STAT-35 (SHOULD NOT).** Intervals SHOULD NOT be reported without stating the method and its dependence assumptions. _Rationale:_ an unqualified interval is uninterpretable and unauditable.

## Effect Size

- **STAT-36 (MUST).** Every claim MUST report a standardized effect size and, for economic claims, a **net-of-cost** effect (per RB-10 · FCTR; `P2-04`). Significance without a materially meaningful effect MUST NOT be promoted. _Rationale:_ STAT-7, AD-1, AP-10.
- **STAT-37 (MUST).** A minimum economically-meaningful effect size (**MMES**, a GRC-governed parameter per asset class) MUST be pre-registered; results below MMES are rejected regardless of p-value. _Rationale:_ prevents statistically-significant-but-useless factors from consuming budget and capital.

## Statistical Power

- **STAT-38 (MUST).** A power analysis MUST be performed and recorded before evaluation, targeting **power ≥ 0.80 (GRC default)** to detect the pre-registered MMES. _Rationale:_ underpowered studies produce unreliable, inflated effect estimates (winner's curse).
- **STAT-39 (MUST NOT).** An underpowered experiment MUST NOT be used as promotion evidence; it MAY inform exploratory direction only, and still counts against the trial budget. _Rationale:_ low power + selection = exaggerated false positives.

## Sample Size

- **STAT-40 (MUST).** Minimum sample size MUST be derived from the power analysis and pre-registered. For time-series, "sample size" MUST reflect the **effective number of independent observations** given autocorrelation and overlapping labels, not the raw row count. _Rationale:_ overlapping labels massively overstate information (a core CV-purging concern, STAT-45).
- **STAT-41 (MUST).** Claims MUST report both raw and effective sample size; where effective sample size is small, the claim MUST be labeled low-confidence irrespective of significance. _Rationale:_ transparency about true information content.

## Cross-Validation Standards

> **Boundary note.** STAT defines _what makes cross-validation statistically valid_. The _execution and gating_ of CV is owned by RB-04 · VAL (`P2-06`); _as-of correctness of the underlying data_ is owned by RB-08 · PIT (`P1-01`).

- **STAT-42 (MUST).** All cross-validation on temporally ordered data MUST preserve time order and prevent information from the future or from label-overlap windows entering the training fold. Standard i.i.d. k-fold is PROHIBITED for time-series. _Rationale:_ VS-3; naive k-fold leaks and inflates results (REVIEW C1, FB-7).
- **STAT-43 (MUST).** The CV scheme, fold count, purge window, and embargo MUST be pre-registered and MUST NOT be changed to improve a result. _Rationale:_ CV-tuning to a target is p-hacking (FB-8).
- **STAT-44 (MUST).** CV performance MUST be reported with dispersion across folds, not a single averaged number; a signal that works only in some folds MUST be flagged unstable (§Factor Stability). _Rationale:_ averaged CV hides fragility.

## Purged Cross-Validation

- **STAT-45 (MUST).** When training and test labels can overlap in time, observations whose label windows overlap the test set MUST be **purged** from training. _Rationale:_ overlapping labels create leakage that fabricates skill (REVIEW C1; `P2-06`).
- **STAT-46 (MUST).** Purging parameters MUST be derived from the label horizon, not chosen for convenience, and MUST be recorded. _Rationale:_ under-purging leaks; the horizon is the correct, non-arbitrary basis.

## Combinatorial Purged Cross-Validation (CPCV)

- **STAT-47 (MUST).** Estimation of backtest overfitting (Probability of Backtest Overfitting, PBO) and the distribution of out-of-sample performance MUST use a combinatorial purged, embargoed scheme producing multiple OOS paths; a single train/test split MUST NOT be the basis for an overfitting judgment. _Rationale:_ `P2-06`; multiple combinatorial paths are required to estimate PBO honestly.
- **STAT-48 (MUST).** PBO MUST be reported for every strategy-level candidate; a candidate with **PBO above a GRC-governed threshold (default 0.5)** MUST be rejected. _Rationale:_ PBO > 0.5 means the selected configuration is more likely overfit than not.

## Walk-Forward Validation

- **STAT-49 (MUST).** Walk-forward evaluation MUST use only information available up to each decision point (as-of; RB-08 · PIT) and MUST retrain/refit on a rolling or expanding window that never includes future data. _Rationale:_ PIT-1..PIT-3, FB-6.
- **STAT-50 (SHOULD).** Walk-forward SHOULD be used as the primary realism check for strategies whose parameters adapt over time, complementing CPCV. _Rationale:_ walk-forward best mirrors live deployment dynamics.

## Embargo Rules

- **STAT-51 (MUST).** An **embargo** period MUST be applied after each test window during which observations are excluded from training to prevent leakage via serial correlation and post-event drift. _Rationale:_ purging alone is insufficient when effects persist beyond the label window (`P2-06`).
- **STAT-52 (MUST).** Embargo length MUST be at least the maximum autocorrelation/label-persistence horizon of the target, pre-registered, and justified. **Default lower bound is the label horizon; GRC may require longer per asset class.** _Rationale:_ too-short embargo leaks; the persistence horizon is the principled floor.

## Holdout Rules

> **Boundary note.** Holdout _data management and one-shot access_ are owned by RB-04 · VAL / the Holdout & Embargo Manager (`P2-05`) and RB-08 · PIT. STAT defines the _statistical discipline_ of holdout use.

- **STAT-53 (MUST).** A final holdout / out-of-sample segment MUST be evaluated **at most once** per candidate, as a one-shot confirmatory test with a pre-registered decision rule. Iterative "evaluate → tweak → re-evaluate" against holdout is PROHIBITED. _Rationale:_ SI-4; iterative use silently contaminates the holdout (REVIEW C6, AP-6).
- **STAT-54 (MUST).** Each holdout evaluation MUST consume from a pre-allocated, audited holdout budget; once a fold is used it is **burned** and MUST NOT be reused (RB-04 · VAL / `P2-05`). _Rationale:_ SI-4; a reused holdout is no longer out-of-sample.
- **STAT-55 (MUST NOT).** Generation/idea-producing actors MUST NOT observe per-candidate holdout or validation outcomes; only aggregate, delayed, budgeted signals may cross the isolation barrier (RB-18 · AGENT / `P2-07`). _Rationale:_ AD-3; otherwise the generator learns to defeat the validator — the deepest quant flaw (REVIEW, AP-3).

## Nested Validation

- **STAT-56 (MUST).** When hyperparameters or model selection are involved, model selection MUST occur in an **inner** validation loop strictly separated from the **outer** performance-estimation loop; the outer estimate MUST never see selection decisions. _Rationale:_ selecting and evaluating on the same data inflates performance (selection bias, STAT-73).
- **STAT-57 (MUST).** The number of configurations explored in the inner loop MUST be counted toward the trial budget (STAT-14, STAT-19). _Rationale:_ hyperparameter search is multiple testing.

## Bootstrap Standards

- **STAT-58 (MUST).** Bootstrap procedures on time-series MUST use dependence-preserving resampling (e.g., block or stationary bootstrap); the i.i.d. bootstrap is PROHIBITED for serially correlated data. _Rationale:_ i.i.d. resampling destroys autocorrelation and understates uncertainty.
- **STAT-59 (MUST).** The resampling scheme, block-length selection rule, and number of resamples MUST be pre-registered and reported; the number of resamples MUST be large enough that Monte Carlo error is negligible relative to the reported precision. _Rationale:_ reproducibility (RP-\*) and honest precision.
- **STAT-60 (MUST).** Bootstrap randomness MUST be seeded and captured in the Run Manifest (RB-05 · REPRO / `P1-02`). _Rationale:_ CP-4, FB-10.

## Monte Carlo Standards

- **STAT-61 (MUST).** Monte Carlo experiments MUST pre-register the data-generating process, number of simulations, and seeds; results MUST report Monte Carlo standard error. _Rationale:_ an MC result without its own error bar is not interpretable.
- **STAT-62 (MUST).** Synthetic/null-data simulations MUST be run to confirm that the research pipeline does **not** manufacture significance from noise; if "alpha" appears on properly randomized data, the pipeline is defective and all dependent claims are void. _Rationale:_ null-model testing (ARCH §2.6; REVIEW) is a required pipeline self-check.
- **STAT-63 (MUST).** All Monte Carlo randomness MUST be seeded and manifest-captured (RB-05 · REPRO). _Rationale:_ reproducibility.

## Time-Series Validation

- **STAT-64 (MUST).** All validation MUST respect temporal ordering, non-stationarity, and regime dependence; any procedure that shuffles time or assumes stationarity without testing it is PROHIBITED. _Rationale:_ VS-3; markets are non-stationary and regime-dependent.
- **STAT-65 (MUST).** Stationarity and structural-break assumptions MUST be tested and reported; where non-stationarity is present, inference MUST use methods robust to it or condition on regime (§Regime Stability). _Rationale:_ unaddressed non-stationarity invalidates standard inference.

## Out-of-Sample Standards

- **STAT-66 (MUST).** "Out-of-sample" MUST mean data never used — directly or indirectly — in feature construction, model fitting, selection, or threshold setting. Any prior contact voids OOS status. _Rationale:_ SI-4, FB-6/FB-7.
- **STAT-67 (MUST).** OOS performance MUST be reported deflated and with dependence-aware intervals; a raw OOS point estimate MUST NOT be presented as promotion evidence. _Rationale:_ SI-3, STAT-34.
- **STAT-68 (MUST).** OOS degradation relative to in-sample MUST be quantified; degradation beyond a **GRC-governed tolerance** is a rejection trigger (§Rejection Criteria). _Rationale:_ large IS→OOS gaps are the signature of overfitting.

## Feature Significance

- **STAT-69 (MUST).** A feature's predictive contribution MUST be evaluated by pre-registered, leakage-free tests (RB-08 · PIT leakage harness, `P2-03`), reported with effect size and uncertainty, and counted in the trial budget. _Rationale:_ features are hypotheses and incur multiplicity.
- **STAT-70 (MUST NOT).** Feature importance derived from a model fit on the full sample (including test data) MUST NOT be used as evidence of significance. _Rationale:_ in-sample importance is not out-of-sample predictiveness.

## Factor Significance

- **STAT-71 (MUST).** A factor's significance MUST survive: deflation for the effective number of trials (STAT-21), FWER control at capital-grade α (STAT-27), robustness across subperiods/sub-universes/regimes (§Robustness), and PBO below threshold (STAT-48). Failing any one is rejection. _Rationale:_ SI-1..SI-3, VS-\*, RG-1; capital-grade evidence is cumulative.
- **STAT-72 (MUST).** Factor significance claims MUST be defined **net of realistic costs** (RB-10 · FCTR; `P2-04`, AD-1) and accompanied by an economic rationale evaluated elsewhere (RB-02 · RMET / `P3-12`). _Rationale:_ AP-10; gross significance is not alpha.

## Correlation Analysis

- **STAT-73 (MUST).** Reported correlations MUST specify the estimator, window, and whether they are computed on returns, residuals, or signals, and MUST use dependence-aware significance (STAT-34). _Rationale:_ ambiguous correlations are uninterpretable and prone to spurious significance.
- **STAT-74 (MUST).** Correlation MUST NOT be interpreted as causation; causal claims require the Explainability/economic-rationale process (RB-02 · RMET / `P3-12`), not correlation alone. _Rationale:_ EXP-1; spurious correlations abound in financial data.

## Multicollinearity

- **STAT-75 (MUST).** Multicollinearity among predictors MUST be assessed and reported; where present, inference on individual coefficients MUST be treated as unreliable and MUST NOT be used to attribute effect to a specific collinear predictor. _Rationale:_ collinearity destabilizes coefficient estimates and misattributes effects.

## Orthogonality

- **STAT-76 (MUST).** A candidate factor MUST be evaluated for incremental explanatory power **after** orthogonalization against known risk factors and the existing factor library (mechanics owned by RB-10 · FCTR; `P3-06`). A factor whose incremental deflated significance is below threshold MUST be rejected as redundant. _Rationale:_ FC-2, AP; "new" factors that are variants of existing ones inflate the zoo and corrupt trial correlation.
- **STAT-77 (MUST).** Orthogonalization MUST be performed only with as-of information; forward-looking residualization is PROHIBITED. _Rationale:_ PIT-3, FB-6.

## Feature Stability

- **STAT-78 (MUST).** A feature's distribution and predictive relationship MUST be tested for stability across time and sub-populations; unstable features MUST be labeled and MUST NOT be promoted without an explicit stability rationale. _Rationale:_ unstable features do not generalize.

## Factor Stability

- **STAT-79 (MUST).** A factor's performance MUST be stable across pre-registered subperiods, sub-universes, and regimes within a **GRC-governed dispersion tolerance**; instability beyond tolerance is a rejection trigger. _Rationale:_ VS; a factor that works only in one slice is likely an artifact.
- **STAT-80 (SHOULD).** Parameter-perturbation testing SHOULD demonstrate that small changes to a factor's parameters do not collapse its performance. _Rationale:_ knife-edge parameters signal overfitting.

## Drift Detection

- **STAT-81 (MUST).** Deployed factors and models MUST be monitored for statistical drift (change in predictive relationship, decay of effect) using pre-registered tests; monitoring is owned operationally by RB-28 · OBS (`P4-01`, `P3-15`), with statistical criteria defined here. _Rationale:_ alpha decays; undetected drift bleeds capital (RL-2, `P3-09`).
- **STAT-82 (MUST).** A drift breach beyond a pre-registered threshold MUST trigger the factor-retirement review (RB-10 · FCTR / `P3-09`). _Rationale:_ RL-2.

## Regime Stability

- **STAT-83 (MUST).** Performance and significance MUST be reported **conditional on regime** using the Regime Service (RB-10 · FCTR reference; `P3-10`); an unconditional claim that hides regime dependence is inadmissible. _Rationale:_ alpha is conditional; unconditional claims overstate durability (REVIEW quant risks).
- **STAT-84 (MUST NOT).** Regime definitions MUST NOT be selected post hoc to maximize apparent significance; regime schemes MUST be pre-registered. _Rationale:_ post-hoc regime slicing is p-hacking.

## Survivorship Bias

- **STAT-85 (MUST).** All analyses MUST use survivorship-bias-free universes that include delisted, merged, and dead entities as of each historical date (data owned by RB-08 · PIT; ARCH §2.3). Evidence of survivorship-free construction MUST accompany the claim. _Rationale:_ FB-7; survivorship inflates historical performance.
- **STAT-86 (MUST).** Derivative and index-membership survivorship (e.g., option chains around actions, index reconstitution) MUST be handled; ignoring it is PROHIBITED. _Rationale:_ REVIEW M4; a common silent corruption.

## Look-Ahead Bias

- **STAT-87 (MUST).** Every computation MUST use only as-of information via the As-Of Gateway (RB-08 · PIT; `P1-01`). Any read without an `as_of`, or use of restated/reference data not stamped as-of, is PROHIBITED and voids the claim. _Rationale:_ PIT-1..PIT-3, FB-6, CP-3.
- **STAT-88 (MUST).** Absence of look-ahead MUST be affirmatively evidenced by the leakage harness (RB-08 · PIT / `P2-03`); silence is treated as failure. _Rationale:_ CP-1.

## Data Leakage

- **STAT-89 (MUST).** Features, labels, and splits MUST be free of target leakage and train/test contamination, evidenced by the leakage harness including the predict-the-`as_of`-timestamp test (RB-08 · PIT / `P2-03`). A leakage-harness failure blocks promotion. _Rationale:_ REVIEW C1; leakage is the top killer of institutional research.
- **STAT-90 (MUST).** Normalization, scaling, imputation, and feature-selection statistics MUST be fit only on training data within each fold and applied to validation/test data; full-sample preprocessing is PROHIBITED. _Rationale:_ full-sample preprocessing leaks the future (a subtle, common leak).

## Selection Bias

- **STAT-91 (MUST).** The universe, sample, and candidate-selection process MUST be pre-registered; cherry-picking instruments, periods, or candidates after seeing results is PROHIBITED and voids the claim. _Rationale:_ FB-8; selection bias manufactures significance.
- **STAT-92 (MUST).** "Best of N" reporting (presenting the top result among many tried without counting the N) is PROHIBITED; all N MUST be in the trial budget. _Rationale:_ SI-1; the canonical p-hacking pattern.

## Confirmation Bias

- **STAT-93 (MUST).** Analysis choices MUST be fixed before results are seen; any degrees of freedom exercised after seeing data MUST be disclosed and counted, and the result labeled exploratory. _Rationale:_ researcher degrees of freedom are confirmation bias vectors.
- **STAT-94 (SHOULD).** Independent, blinded adjudication (validator has no stake in the outcome) SHOULD be used for capital-grade claims (RB-04 · VAL; separation of powers CP-5). _Rationale:_ the builder of a factor MUST NOT be its judge.

## P-Hacking

- **STAT-95 (MUST NOT).** The following are absolutely PROHIBITED (each voids the claim and is a reportable integrity violation): unregistered trials; altering hypotheses/thresholds/CV/embargo after seeing results; selective reporting; optional stopping without alpha-spending; framework/estimator shopping; regime/universe/period cherry-picking; excluding failed trials from the budget. _Rationale:_ SI-1, FB-8; this rule enumerates the mechanisms of p-hacking so they are individually checkable (CP-1).
- **STAT-96 (MUST).** Every "researcher degree of freedom" that could affect the result MUST be either pre-registered or disclosed-and-counted. _Rationale:_ the garden of forking paths inflates false positives even without intent.

## Overfitting

- **STAT-97 (MUST).** Overfitting risk MUST be quantified via PBO from CPCV (STAT-47/48) and via the in-sample-to-out-of-sample degradation (STAT-68); candidates exceeding thresholds MUST be rejected. _Rationale:_ REVIEW C2/quant; overfitting is the primary failure mode of quantitative research.
- **STAT-98 (SHOULD).** Model complexity SHOULD be constrained and justified relative to the effective sample size; complexity without commensurate effective data is a rejection signal. _Rationale:_ the bias-variance trade-off; too many parameters for the data guarantees overfitting.

## Underfitting

- **STAT-99 (SHOULD).** Evidence of underfitting (systematic inability to capture a pre-registered, economically-motivated relationship) SHOULD be reported; underfitting MUST NOT be resolved by unregistered complexity increases that re-enter the trial budget silently. _Rationale:_ fixing underfitting by unbounded search reintroduces overfitting/p-hacking.

## Robustness Testing

- **STAT-100 (MUST).** Capital-grade claims MUST pass a pre-registered robustness battery: subperiod, sub-universe, parameter-perturbation, and regime-conditioned tests, with results reported as dispersion, not a single number. _Rationale:_ VS; robustness is a required dimension of validity (STAT-9).
- **STAT-101 (MUST).** The robustness battery MUST be fixed before results are seen; adding/removing robustness tests to change an outcome is PROHIBITED. _Rationale:_ STAT-95.

## Stress Testing

- **STAT-102 (MUST).** Strategy-level claims MUST be stress-tested against historical crisis replays and adverse synthetic scenarios (scenario methodology referenced from ARCH §2.7 / RB-11 · BT); tail behavior MUST be reported. _Rationale:_ average-case performance conceals tail risk that destroys capital.
- **STAT-103 (SHOULD).** Stress scenarios SHOULD include liquidity, cost, and regime shocks, not only price shocks. _Rationale:_ realistic institutional stress is multi-dimensional.

## Sensitivity Analysis

- **STAT-104 (MUST).** Every claim MUST report sensitivity to its key modeling choices (priors, windows, thresholds, cost assumptions); a result that is fragile to reasonable variation MUST be labeled fragile and MUST NOT be promoted without explicit governance acceptance. _Rationale:_ fragility to defensible choices indicates an artifact.

## Reproducibility

> **Boundary note.** Manifest/determinism mechanics are owned by RB-05 · REPRO (`P1-02`). STAT states the statistical reproducibility requirement.

- **STAT-105 (MUST).** Every statistical result MUST be reproducible bit-for-bit from its Run Manifest (seeds, as-of dataset refs, config, code/env versions) by an independent party (RB-05 · REPRO; CP-4, RP-1). A result that cannot be reproduced is void and MUST NOT inform any decision. _Rationale:_ CP-4, EX-2, FB-10.
- **STAT-106 (MUST).** All randomness (bootstrap, Monte Carlo, CV shuffling within folds, model init) MUST be seeded and captured. _Rationale:_ unseeded randomness breaks reproducibility.
- **STAT-107 (MUST NOT).** No optimization, tuning, or fitting MAY be performed without a captured manifest ("no optimization without reproducibility"). _Rationale:_ FB-10, RP-2.

## Independent Replication

- **STAT-108 (MUST).** No claim may reach capital eligibility without **independent replication** of its key statistical results via a separate code path (executed by RB-04 · VAL / `P2-08`). Discrepancy beyond a pre-registered tolerance auto-rejects. _Rationale:_ VS-4; reproducibility (same code) is not replication (independent confirmation); single-implementation bugs masquerade as alpha (REVIEW Missing #4).
- **STAT-109 (SHOULD).** Replication SHOULD use a different implementation and, where feasible, a different analyst, to catch shared-assumption errors. _Rationale:_ independence maximizes error-catching power.

## Statistical Audit

- **STAT-110 (MUST).** Every statistical claim MUST be auditable end-to-end: an auditor MUST be able to trace pre-registration → trial-ledger entry → data as-of refs → manifest → deterministic verdict, and re-derive the conclusion, without consulting the claimant. _Rationale:_ CP-7, STAT-2.
- **STAT-111 (MUST).** The statistical function MUST be subject to periodic independent audit (frequency GRC-governed) sampling promoted and rejected claims to confirm compliance; audit findings are recorded in the tamper-evident audit trail. _Rationale:_ CP-7; controls that are never audited decay.
- **STAT-112 (MUST).** Realized false-discovery rate, budget consumption, and IS→OOS degradation MUST be reported to GRC via Research Scorecards (`P3-13`) on a governed cadence. _Rationale:_ CI-1; the institution MUST measure whether its statistical controls are working.

---

## Acceptance Criteria (statistical)

A statistical claim is **accepted** only when **all** hold. This is a cumulative gate; failing any item is rejection.

**Acceptance checklist:**

- [ ] Hypothesis, endpoints, thresholds, CV/embargo, framework, and robustness battery were pre-registered and unchanged (STAT-5, STAT-43, STAT-95).
- [ ] Trial enrolled in the ledger; all sibling/discarded trials counted in the family budget (STAT-14, STAT-20).
- [ ] Significance survives correlation-aware deflation and the applicable error control (FDR discovery / FWER capital-grade) (STAT-19–STAT-28).
- [ ] Effect size ≥ pre-registered MMES, net of costs; power ≥ target; effective sample size adequate (STAT-36–STAT-41, STAT-72).
- [ ] CV is purged + embargoed (+ CPCV for PBO); PBO below threshold; nested selection separated from estimation (STAT-42–STAT-57).
- [ ] OOS status intact; one-shot holdout honored; OOS reported deflated with dependence-aware intervals; IS→OOS degradation within tolerance (STAT-53, STAT-66–STAT-68).
- [ ] Absence of look-ahead, leakage, survivorship, and selection bias affirmatively evidenced (STAT-85–STAT-92).
- [ ] Robustness, stress, and sensitivity results within tolerance and pre-registered (STAT-100–STAT-104).
- [ ] Reproducible from manifest; independently replicated within tolerance (STAT-105–STAT-109).
- [ ] Fully auditable end-to-end (STAT-110).

## Rejection Criteria

A claim MUST be **rejected** (and the rejection recorded per RB-02 · RMET / `P3-05`) if **any** hold:

- **STAT-113 (MUST).** Significance fails after deflation/error control; or PBO exceeds threshold; or IS→OOS degradation exceeds tolerance.
- **STAT-114 (MUST).** Any p-hacking pattern (STAT-95) is detected, or any trial went uncounted.
- **STAT-115 (MUST).** Look-ahead, leakage, survivorship, or selection bias is present or unevidenced.
- **STAT-116 (MUST).** Effect size below MMES, or study underpowered, or effective sample size inadequate.
- **STAT-117 (MUST).** Result is not reproducible, or replication discrepancy exceeds tolerance, or holdout was used more than once.
- **STAT-118 (MUST).** Instability across subperiods/sub-universes/regimes beyond tolerance, or fragility to reasonable modeling choices.
- **STAT-119 (MUST).** Redundancy: incremental deflated significance after orthogonalization below threshold.

_Rationale (STAT-113–119):_ these are the operational expressions of SI-_, VS-_, and FB-6..FB-10; rejection is deterministic, not discretionary (STAT-3, DE-1).

## Promotion Gates

Statistical evidence required at each gate (this rulebook governs the **statistical** portion; overall gate orchestration is RB-04 · VAL / `P2-09` and release is RB-30 · DEPLOY):

| Gate                             | Statistical evidence required                                                                          | Error control               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------- |
| **Discovery → Candidate**        | Pre-registration, ledger enrollment, purged CV, effect ≥ MMES, power ≥ target                          | FDR (STAT-24)               |
| **Candidate → Capital-Eligible** | CPCV + PBO, one-shot holdout, robustness/stress/sensitivity, independent replication, redundancy check | FWER (STAT-27)              |
| **Capital-Eligible → Deployed**  | Deflated OOS confirmation, regime-conditioned reporting, drift-monitoring plan registered              | FWER + monitoring (STAT-81) |

- **STAT-120 (MUST).** No candidate advances a gate without the full evidence for that gate; partial evidence is rejection. _Rationale:_ RG-1, RG-3; gates are cumulative and non-negotiable.
- **STAT-121 (MUST NOT).** A gate MUST NOT be satisfied by human or LLM assertion in lieu of the deterministic evidence. _Rationale:_ AI-2, DE-1, HO-3.

## Required Evidence (evidence package)

- **STAT-122 (MUST).** Every promotion request MUST carry a complete, machine-readable evidence package containing: the frozen pre-registration; trial-ledger references and family budget state; deflation inputs (effective trials) and outputs; CV/CPCV/embargo configuration and per-fold results with PBO; OOS/holdout records; bias-control evidence (leakage-harness, survivorship, selection); robustness/stress/sensitivity results; the Run Manifest; and the independent-replication result. _Rationale:_ CP-7, STAT-110; auditability requires the evidence to travel with the claim.
- **STAT-123 (MUST).** Missing or non-resolving evidence references block promotion (fail-closed). _Rationale:_ CP-1; absence of evidence is treated as failure, never as pass.

## Anti-Patterns

Recognized statistical failure modes that MUST be actively prevented (mirrors `CLAUDE.md` AP-\*, REVIEW):

- **STAT-AP-1.** Treating a global trial _counter_ as multiple-testing _control_ (REVIEW C2; STAT-19).
- **STAT-AP-2.** Reporting undeflated Sharpe/IR as discovery evidence (STAT-3, SI-3).
- **STAT-AP-3.** Iterative holdout use ("peek, tweak, repeat") (STAT-53; REVIEW C6).
- **STAT-AP-4.** Generator observing validator/OOS outcomes and overfitting the referee (STAT-55; AD-3).
- **STAT-AP-5.** Full-sample preprocessing/feature-selection leaking into folds (STAT-90).
- **STAT-AP-6.** "Best of N" without counting N; post-hoc universe/period/regime slicing (STAT-92, STAT-84).
- **STAT-AP-7.** Selecting alpha on gross (pre-cost) performance (STAT-72; AP-10).
- **STAT-AP-8.** Single train/test split used to judge overfitting instead of CPCV/PBO (STAT-47).
- **STAT-AP-9.** i.i.d. assumptions (k-fold, i.i.d. bootstrap, naive CIs) on serially dependent data (STAT-34, STAT-42, STAT-58).
- **STAT-AP-10.** Unregistered hyperparameter/framework search excluded from the budget (STAT-29, STAT-57).

## Forbidden Statistical Practices

Absolute prohibitions. Violation voids the artifact, blocks merge/promotion, and is a reportable integrity event (`CLAUDE.md` FB-\*, HO-3):

- **STAT-F-1.** Running or reporting a trial that was not registered before execution.
- **STAT-F-2.** Altering any pre-registered element after seeing results and presenting it as planned.
- **STAT-F-3.** Excluding failed/discarded trials from the multiple-testing budget.
- **STAT-F-4.** Using non-point-in-time data, or reading without an `as_of`.
- **STAT-F-5.** Any look-ahead, data leakage, or survivorship bias.
- **STAT-F-6.** Using the final holdout more than once per candidate, or reusing a burned fold.
- **STAT-F-7.** Presenting significance without correlation-aware deflation and applicable error control.
- **STAT-F-8.** Manual editing of statistical, backtest, or validation results.
- **STAT-F-9.** Optimization/tuning/fitting without a captured reproducibility manifest.
- **STAT-F-10.** Any LLM asserting, computing-as-authoritative, or approving statistical significance or a promotion (AI-2, DE-1).
- **STAT-F-11.** Bypassing, resetting, or forking the Trial Ledger or a governance gate.

---

## Enforcement & Verification

Per Framework §9, each rule declares an enforcement mechanism. Summary mapping:

| Rule group                                            | Primary enforcement                                                  | Mechanism owner                          |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| Pre-registration & registration (STAT-5,13,14)        | CI gate: no evaluation without frozen pre-reg + ledger entry         | RB-03 · EXP, RB-02 · RMET                |
| Multiple testing, FDR/FWER, deflation (STAT-19–28)    | CI gate: deterministic budget enforcer; promotion refused on failure | RB-04 · VAL (`P2-02`)                    |
| CV, CPCV, embargo, holdout, OOS (STAT-42–68)          | CI gate: validation gauntlet; leakage harness; one-shot holdout      | RB-04 · VAL, RB-08 · PIT (`P2-03/05/06`) |
| Bias controls (STAT-85–92)                            | CI gate: leakage harness + survivorship-free universe check          | RB-08 · PIT                              |
| Reproducibility & replication (STAT-105–109)          | CI gate: manifest completeness; replication engine                   | RB-05 · REPRO, RB-04 · VAL (`P2-08`)     |
| Effect size, power, sample (STAT-36–41)               | CI gate + review checklist                                           | RB-04 · VAL                              |
| Robustness/stress/sensitivity/stability (STAT-78–104) | CI gate (battery) + review checklist                                 | RB-04 · VAL                              |
| Audit (STAT-110–112)                                  | Periodic independent audit + scorecards                              | GRC, RB-28 · OBS                         |
| Forbidden practices (STAT-F-\*)                       | Fail-closed gate; integrity report                                   | GRC                                      |

- **STAT-E-1 (MUST).** Every rule enforcing a Forbidden Practice (STAT-F-*) or a Constitutional Forbidden Practice MUST be CI-gated and fail-closed where technically possible (Framework RBK-E2). *Rationale:\* CP-1.
- **STAT-E-2 (MUST).** LLM agents MAY assist by drafting, explaining, or narrating statistical analyses but MUST NOT execute the acceptance/rejection decision (AI-2, DE-1). Enforced by agent authority flags (RB-18 · AGENT). _Rationale:_ the judgment must be deterministic.

## Exceptions & Waivers

- **STAT-W-1 (MUST).** No exception MAY be granted to any Forbidden Statistical Practice (STAT-F-\*) or to any rule enforcing a `CLAUDE.md` entrenched clause (AM-2). These are non-waivable.
- **STAT-W-2 (MAY).** A **GRC-governed parameter** (e.g., FDR q, FWER α, MMES, power target, PBO threshold, degradation/dispersion tolerances, embargo floor, audit cadence) MAY be changed only by GRC, recorded as a versioned parameter set with rationale in the audit trail, applied prospectively (VER-2). A researcher or agent MUST NOT change these.
- **STAT-W-3 (MAY).** A time-boxed waiver of a non-entrenched rule MAY be granted only by HR + GRC, recorded in the audit trail with scope, expiry, and rationale, and MUST NOT weaken multiplicity control, OOS integrity, or reproducibility. _Rationale:_ the core controls are the point of the rulebook.
- **STAT-W-4 (MUST).** Every active waiver MUST be surfaced on the affected claim's evidence package so downstream reviewers see it. _Rationale:_ no hidden exceptions.

## Rulebook Acceptance Criteria (ratification)

This rulebook is ratifiable (Framework §10) only when: every rule has a stable ID, RFC 2119 phrasing, a constitutional basis, and a declared enforcement mechanism; no rule contradicts `CLAUDE.md`, the Architecture Canon, or the Single-Source-of-Truth Map; all GRC-governed parameters have recorded defaults; all cross-references resolve; and ARB approval with GRC co-sign is obtained.

## Success Metrics

- **SM-1.** Realized false-discovery rate within the GRC target band (STAT-24, STAT-112).
- **SM-2.** Zero promotions passing on undeflated metrics or unregistered trials (STAT-F-1, STAT-F-7).
- **SM-3.** 100% of executed trials ledger-accounted; 0 detected ledger resets/forks (STAT-14, STAT-F-11).
- **SM-4.** 0 look-ahead/leakage/survivorship findings on promoted claims in audit (STAT-85–92).
- **SM-5.** 100% of promoted claims reproducible from manifest and independently replicated within tolerance (STAT-105–109).
- **SM-6.** 0 LLM-made statistical decisions (STAT-F-10).
- **SM-7.** Median IS→OOS degradation and PBO distribution trending within tolerance over time.

## Dependencies & Related Rulebooks

- **Depends on:** RB-03 · EXP (registration, trial ledger), RB-05 · REPRO (manifests), RB-08 · PIT (as-of, leakage, survivorship-free data).
- **Consumed by / referenced by:** RB-04 · VAL (executes these standards), RB-09 · FEAT, RB-10 · FCTR, RB-11 · BT, RB-15 · AIGOV, RB-18 · AGENT.
- **Co-governs parameters with:** GRC (all thresholds), MRC (where model significance intersects AI).
- **Architecture references:** REVIEW C1/C2/C6; PATCH `P2-01..P2-09`, `P2-04`, `P3-10/12/13`; ARCH §2.6, §8.

## Change Log & Version History

| Version | Date    | Author (role) | Change                                | ADR |
| ------- | ------- | ------------- | ------------------------------------- | --- |
| 1.0.0   | pending | HR            | Initial ratified statistics rulebook. | —   |

---

## Glossary (statistics-specific)

Terms already defined in `CLAUDE.md` Glossary (Alpha, As-Of Read, Deflated Metric, Holdout/OOS, Isolation Barrier, Manifest, Pre-Registration, Trial Ledger, etc.) are **not** redefined here.

- **Research Family** — A pre-declared group of related trials over which a single error budget (FDR/FWER) is allocated and consumed (STAT-20).
- **Effective Number of Trials** — A correlation-adjusted count of independent tests used for deflation, replacing the raw trial count (STAT-21).
- **FWER (Family-Wise Error Rate)** — Probability of at least one false positive across a family; the strict control used for capital-grade confirmation (STAT-27).
- **FDR (False Discovery Rate)** — Expected proportion of false positives among declarations; the control used for discovery-scale screening (STAT-24).
- **MMES (Minimum Economically-Meaningful Effect Size)** — The pre-registered, net-of-cost effect below which a result is rejected regardless of significance (STAT-37).
- **PBO (Probability of Backtest Overfitting)** — The estimated probability that the selected configuration's in-sample superiority does not persist out-of-sample, derived from CPCV (STAT-47).
- **Purging** — Removal from training of observations whose label windows overlap the test period (STAT-45).
- **Embargo** — A post-test exclusion window preventing leakage via serial correlation and drift (STAT-51).
- **Nested Validation** — Separation of model selection (inner loop) from performance estimation (outer loop) (STAT-56).
- **Block/Stationary Bootstrap** — Dependence-preserving resampling required for serially correlated data (STAT-58).
- **Null-Model / Synthetic-Data Test** — Running the pipeline on randomized/synthetic data to confirm it does not fabricate significance (STAT-62).
- **IS→OOS Degradation** — The decline from in-sample to out-of-sample performance; a primary overfitting signal (STAT-68).
- **Researcher Degrees of Freedom** — Analysis choices that, if exercised after seeing data, inflate false positives; must be pre-registered or disclosed-and-counted (STAT-96).
- **GRC-Governed Parameter** — A numeric threshold set by the Governance & Risk Committee, changeable only via §Exceptions, never by a researcher or agent.

---

_End of Statistics & Statistical Integrity Rulebook (RB-01 · STAT). This document is Tier-3 operational law. It defines statistical standards and requirements; it references — and never restates — the mechanisms owned by peer rulebooks and the Architecture Canon. Binding upon ARB ratification._
