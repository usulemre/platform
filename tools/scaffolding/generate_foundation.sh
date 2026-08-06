#!/usr/bin/env bash
#
# generate_foundation.sh — Phase 0 Repository Foundation generator.
#
# Governed by: CLAUDE.md; Architecture V2; Implementation Roadmap (Phase 0).
# Purpose: deterministically (re)generate the institutional monorepo skeleton —
#          directories, placeholder stubs, and per-directory README documentation.
#          It creates NO business logic, NO quantitative algorithms, NO application code.
#
# This script is itself an auditable, reproducible artifact (IMP-7, IMP-17): running it
# on a clean checkout yields the ratified Phase 0 structure. It is idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
cd "$ROOT"

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

# mk <dir> : create <dir>, write README.md from this call's stdin heredoc, add .gitkeep
mk() { mkdir -p "$1"; cat > "$1/README.md"; touch "$1/.gitkeep"; }

# leaf <dir> <title> <purpose> <owner> <arch> <phase> <deps> <gov> <allowed> <forbidden>
leaf() {
  local dir="$1" title="$2" purpose="$3" owner="$4" arch="$5" phase="$6" deps="$7" gov="$8" allowed="$9" forbidden="${10}"
  mkdir -p "$dir"; touch "$dir/.gitkeep"
  cat > "$dir/README.md" <<EOF
# $title

> **Phase 0 scaffolding placeholder — structure only.** No business logic, no quantitative
> algorithms, no application code (Implementation Roadmap, Phase 0).

## Purpose
$purpose

## Scope
Establishes the governed home for this module's contracts, interfaces, and documentation so
all later construction is compliant by construction. In Phase 0 this directory holds only
scaffolding; implementation lands in the phase noted below under contract-first governance.

## Responsibilities
Hold the contract skeletons, interface placeholders, and documentation for this module.
Adjudication and consequential decisions belong to the deterministic engines
(Architecture V2 §5.6/§6.3) and are never performed here.

## Allowed Contents
$allowed.

## Forbidden Contents
$forbidden.

## Ownership
Accountable role: $owner. Architecture owner: ARB (Architecture V2 §9); every layer has a
named domain lead accountable for conformance.

## Architecture Mapping
$arch — implemented in $phase (Implementation Roadmap, Part C).

## Dependencies
$deps. Dependencies flow inward toward stable contracts only (IMP-12, AV2-13); direct
cross-layer access to internals and circular dependencies are PROHIBITED.

## Related Governance Documents
CLAUDE.md; Architecture V2; Implementation Roadmap; $gov.
EOF
}

# =============================================================================
# TOP-LEVEL DIRECTORIES (bespoke READMEs)
# =============================================================================

mk "apps" <<'EOF'
# apps/ — User Applications

> **Phase 0 scaffolding placeholder.** Structure only — no application code.

## Purpose
Human access, control, and human-in-the-loop gates: the consoles through which named humans
approve, oversee, and monitor the platform. Applications act **only** through governed
service APIs and gates — they never contain decision logic and never bypass a control.

## Scope
Frontend/console applications only. All authority resolves to the deterministic engines and
human governance behind the service contracts (Architecture V2 §5.9 boundary; §6.2 human
boundary). Built in **Phase 7** (Implementation Roadmap, Part C).

## Members
- `research-ui/` — surfaces registries, experiments, and verdicts (read + propose).
- `admin-ui/` — administration, ownership, lifecycle, and approval/sign-off consoles.
- `monitoring-ui/` — production monitoring, drift/parity, and alerting views.
- `docs-portal/` — the governance and documentation portal.

## Allowed Contents
UI application skeletons; API-client bindings to service contracts; approval/sign-off UI
placeholders; documentation. No back-doors around governed APIs.

## Forbidden Contents
Any decision, validation, risk, allocation, or execution logic; any path that bypasses a
governance gate or control (Architecture V2 §5.9 Failure); direct database or engine access.

## Ownership
Accountable role: PE. Architecture owner: ARB.

## Dependencies
Consumes Phases 2–6 strictly through their service/API contracts. No app depends on another
app; no circular dependencies.

## Related Governance Documents
CLAUDE.md (HO-1..4); Architecture V2 §5.9, §6.2; RB-20 · CODE; RB-23 · DOC; Implementation
Roadmap Phase 7.
EOF

mk "services" <<'EOF'
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
EOF

mk "packages" <<'EOF'
# packages/ — Shared Libraries & SDKs

> **Phase 0 scaffolding placeholder.** Structure only — no business logic.

## Purpose
The versioned, reusable building blocks shared across services and apps: the domain model,
shared types, contract bindings, and the cross-cutting spines (configuration, logging,
observability, security, validation) plus the platform SDKs (workflow engine, AI runtime,
research SDK, data SDK). Consumers depend on **contracts, not implementations** (IMP-10).

## Scope
Reusable, side-effect-controlled libraries only. A package MUST NOT branch on asset class
(CP-8) and MUST be independently versioned (VER-1).

## Members
core-domain · shared-types · contracts · utilities · configuration · logging · observability ·
security · validation · workflow-engine · ai-runtime · research-sdk · data-sdk.

## Allowed Contents
Interface/type skeletons; contract bindings; documentation. Pure, replaceable libraries.

## Forbidden Contents
Business logic/algorithms in Phase 0; asset-class branching (CP-8); god-modules or
over-generic universal interfaces (AP-5); secrets (SEC-3, CODE-29); ambient time/RNG (CS-3).

## Ownership
Accountable role: PE / HSRE (platform); security package: CISO; ai-runtime: HAI. Architecture
owner: ARB.

## Dependencies
Packages depend inward toward stable abstractions only (IMP-12); no circular dependencies.
`core-domain` and `shared-types` are the innermost, dependency-free kernel packages.

## Related Governance Documents
CLAUDE.md; Architecture V2 §5.10; RB-20 · CODE; RB-26 · NAME; Implementation Roadmap Phases 0/1.
EOF

mk "agents" <<'EOF'
# agents/ — AI Agents (registered, contract-bound)

> **Phase 0 scaffolding placeholder.** Directory structure only — agents are **NOT** implemented
> here. Agent implementation lands in **Phase 5**, only after the deterministic core (Phase 4)
> exists for them to defer to (IMP-3, IMP-19).

## Purpose
House the single-responsibility AI agents that **propose** and **narrate** at the fuzzy edges.
Every agent is `propose`- or `narrate`-only; **no agent holds decision authority** (AV2-17).
The concrete roster is the authoritative **AI Agent Registry**; each entry references a
Tier-4 Agent Contract that governs the full specification.

## Scope
One directory per registry category, one sub-directory per registered agent (`AGT-<CAT>-<nnn>`).
An unregistered agent does not exist for operational purposes and MUST NOT run (REG-1).

## Members (by category)
research-discovery (RD) · feature-discovery (FD) · analysis (AN) · validation-narrator (VN) ·
risk-narrator (RN) · portfolio-narrator (PN) · documentation (DO) · engineering (EN) ·
monitoring-narrator (MO).

## Allowed Contents
Per-agent documentation pointing to the registry entry and Tier-4 contract; interface
placeholders for the (Phase 5) agent runtime binding.

## Forbidden Contents
Any decision/approval/execution logic (AI-1..4); OOS/holdout access for generation agents
(AI-5, isolation barrier P2-07); self-modifying contracts or self-escalation (REG-22/23);
implementation before Phase 4 is complete (IMP-19).

## Ownership
Accountable role: HAI (registry system); each agent has a named human owner (see registry).
Architecture owner: ARB.

## Dependencies
Depends on `packages/ai-runtime` and the deterministic engines it narrates/defers to.
Generators and any validation/OOS channel MUST NOT communicate (AC-3, isolation barrier).

## Related Governance Documents
CLAUDE.md (AI-1..8, AG-1..4); Architecture V2 §5.3; RB-15 · AIGOV; Agent Registry; Agent
Contracts (Tier-4); AI Agent Evaluation Framework; Implementation Roadmap Phase 5.
EOF

mk "contracts" <<'EOF'
# contracts/ — Contract Registry (the integration substrate)

> **Phase 0 scaffolding placeholder.** Structure only — contract artifacts are defined
> contract-first as each layer is built.

## Purpose
The single home for the platform's **contracts** — the stable, versioned interfaces every
component depends on instead of depending on implementations (IMP-10, SE-3). This is the
Contracts Spine made concrete (Architecture V2 §5.10); it MUST NOT re-monolithize into a
single global schema (AR-3, P5-02).

## Scope
Contract definitions only (schemas, interface specifications), organized by bounded context.
The **governance frameworks** that own the contract *rules* live in `docs/contracts/`
(Tier-4 Agent Contracts, Tier-5 Workflow Contracts) and are not restated here.

## Members
- `agent_io/` — Tier-4 agent I/O contract artifacts (per CLAUDE.md Table of Authority).
- `workflows/` — Tier-5 workflow contract artifacts.
- `services/` — service-to-service contracts (bounded-context waist).
- `api/` — external/human-facing API contracts consumed by `apps/`.
- `domain/` — shared domain contracts / value-object schemas.

## Allowed Contents
Versioned, semantically-versioned contract skeletons and schema placeholders; documentation.

## Forbidden Contents
Implementations or business logic; a single global monolithic schema (P5-02); breaking a
published contract without a major version bump and migration (VER-1/2, IMP-11).

## Ownership
Accountable role: ARB (owns contracts); domain leads co-own their context's contracts.

## Dependencies
Contracts are the innermost stable abstractions — they depend on nothing but the shared
kernel (`shared/`, `packages/shared-types`). Everything else depends on them.

## Related Governance Documents
CLAUDE.md (SE-2/3, VER-1/2); Architecture V2 §5.10; Agent Contracts; Workflow Contracts;
Implementation Roadmap Phase 0 (contract registry skeleton).
EOF

mk "workflows" <<'EOF'
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
EOF

mk "datasets" <<'EOF'
# datasets/ — Dataset Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no data, no ingestion logic.

## Purpose
The governed home for **dataset artifact definitions and their registry metadata** — certified,
point-in-time-correct, provenance-bearing datasets served only through the As-Of Gateway.
Existence and status are governed by the **Dataset Registry / Dataset Governance**.

## Scope
Dataset registry entries, versions, and lineage metadata (definitions only in Phase 0). Every
dataset is immutable, versioned, and register-before-use.

## Allowed Contents
Dataset registry-entry skeletons; schema/lineage placeholders; documentation.

## Forbidden Contents
Raw vendor data or secrets in the repo (FB-14, GIT-5); non-as-of/uncertified data exposure
(PIT-1, DI-1); silently repairing/overwriting source records or vintages (DI-2/3).

## Ownership
Accountable role: HD. Architecture owner: ARB.

## Dependencies
Served exclusively via the Data Platform Layer / As-Of Gateway (`services/dataset-service`,
`packages/data-sdk`). Built in **Phase 2**.

## Related Governance Documents
CLAUDE.md (DI-1..3, DP-1..3, PIT-1..4); Architecture V2 §5.8; RB-06/07 · DATA; RB-08 · PIT;
Dataset Governance; P1-01.
EOF

mk "experiments" <<'EOF'
# experiments/ — Experiment Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no experiment execution.

## Purpose
The governed home for **experiment manifests and their registry metadata**. Every experiment is
registered with an immutable manifest and linked to the Trial Ledger **before** execution
(EX-1, SM-5); every trial — run, discarded, or failed — is counted for multiple-testing control.

## Scope
Experiment registry entries and immutable manifests (definitions only in Phase 0). Pre-
registration of the falsifiable prediction and success criteria is frozen before evaluation.

## Allowed Contents
Experiment manifest skeletons; pre-registration and Trial-Ledger-linkage placeholders;
negative/failed-research corpus structure; documentation.

## Forbidden Contents
Running an experiment without prior registration and a Trial-Ledger entry (FB-5); post-hoc
alteration of success criteria (p-hacking, FB-8); editing a manifest in place (EX-3);
discarding negative results (SM-4).

## Ownership
Accountable role: HR / HQ (with GRC for statistical governance). Architecture owner: ARB.

## Dependencies
Depends on the Research Intelligence Layer and the Trial Ledger / Statistics engine (Phase 4)
for promotion. Scaffolded in **Phase 3**.

## Related Governance Documents
CLAUDE.md (SM-1..5, EX-1..4, SI-1..5); Architecture V2 §5.5/§5.6; RB-01 · STAT; RB-02 · RMET;
Experiment Tracking Governance; P2-01/02.
EOF

mk "features" <<'EOF'
# features/ — Feature Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no feature computation.

## Purpose
The governed home for **feature definitions and their registry metadata** — declaratively
defined, PIT-bound, leakage-clean, provenance-bearing features in the Feature Marketplace.
Governed by the **Feature Registry**.

## Scope
Feature registry entries and versions (definitions only in Phase 0). A feature is accepted only
after passing the leakage harness and carrying full provenance and a Run Manifest (FA-1..4).

## Allowed Contents
Declarative feature-definition skeletons; provenance/manifest placeholders; documentation.

## Forbidden Contents
Feature computation outside the as-of path (FA-1, PIT-3); full-sample/look-ahead statistics
(FB-7); a feature without provenance (FB-11); mutating an accepted feature (FA-4).

## Ownership
Accountable role: HD / HQ. Architecture owner: ARB.

## Dependencies
Depends on the Data Platform Layer (Feature Factory, As-Of Gateway) and the Leakage Harness;
acceptance gated by the deterministic engines. Scaffolded in **Phase 3** (data side Phase 2).

## Related Governance Documents
CLAUDE.md (FA-1..4, PIT-3, DP-3); Architecture V2 §5.5/§5.8; RB-09/10 · FAR; Feature Registry;
P1-06, P2-03.
EOF

mk "signals" <<'EOF'
# signals/ — Signal Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no signal generation.

## Purpose
The governed home for **signal definitions and their registry metadata** — the signal
generation lifecycle. Governed by the **Signal Registry**.

## Scope
Signal registry entries, versions, and lineage (definitions only in Phase 0). Signals are
register-before-use, immutable, and net-of-cost defined (AD-1).

## Allowed Contents
Signal-definition skeletons; lineage/provenance placeholders; documentation.

## Forbidden Contents
Generation logic in Phase 0; a generator observing per-candidate validation/OOS outcomes
(AD-3, isolation barrier P2-07); gross (pre-cost) selection (AP-10).

## Ownership
Accountable role: HQ. Architecture owner: ARB.

## Dependencies
Depends on `features/` and the deterministic engines that gate acceptance. Scaffolded in
**Phase 3**. Follows features → signal in the research-object chain (IMP-21).

## Related Governance Documents
CLAUDE.md (AD-1..4, CP-5); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry; P2-07.
EOF

mk "strategies" <<'EOF'
# strategies/ — Strategy Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no strategy logic.

## Purpose
The governed home for **strategy definitions and their registry metadata** — the strategy
lifecycle, including a defined death (retirement), not only a birth (RL-2). Governed by the
**Strategy Registry**.

## Scope
Strategy registry entries, versions, and lifecycle state (definitions only in Phase 0).

## Allowed Contents
Strategy-definition skeletons; lifecycle/retirement placeholders; documentation.

## Forbidden Contents
Business logic/algorithms in Phase 0; consuming non-eligible alphas (PS-1); any promotion
without the scientific governance gate and independent replication (FC-5, RG-1).

## Ownership
Accountable role: HQ / HPR. Architecture owner: ARB.

## Dependencies
Depends on `signals/` and the deterministic engines (validation, backtest) that gate it.
Scaffolded in **Phase 3**; promotion enabled only after the First-Capital Gate (IMP-18).

## Related Governance Documents
CLAUDE.md (RL-1/2, FC-1..5, RG-1..3); Architecture V2 §5.5/§5.6; Strategy Registry; P2-08/09.
EOF

mk "portfolios" <<'EOF'
# portfolios/ — Portfolio Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no optimization logic.

## Purpose
The governed home for **portfolio snapshots and their registry metadata** — immutable,
rationale-bearing portfolios produced by the deterministic, net-of-cost optimizer. Governed by
the **Portfolio Registry**.

## Scope
Portfolio registry entries and immutable snapshots (definitions only in Phase 0). Construction
consumes only capital-eligible alphas bearing a valid scientific-eligibility token (PS-1).

## Allowed Contents
Portfolio snapshot/registry-entry skeletons; rationale placeholders; documentation.

## Forbidden Contents
Optimization logic in Phase 0; gross-return optimization (PS-2); an LLM deciding allocation or
sizing (PS-3, AI-1); re-adjudicating whether a signal is real (PS-1).

## Ownership
Accountable role: HPR. Architecture owner: ARB.

## Dependencies
Produced by the Quantitative Engine Layer portfolio optimizer, within Risk Layer limits.
Built in **Phase 4**.

## Related Governance Documents
CLAUDE.md (PS-1..4, RS-1..4); Architecture V2 §5.6/§5.7; RB-12 · PORT; RB-13 · RISK;
Portfolio Registry; P1-08.
EOF

mk "shared" <<'EOF'
# shared/ — Shared Kernel (ubiquitous language)

> **Phase 0 scaffolding placeholder.** Definitions only — no behavior.

## Purpose
The **shared kernel**: the platform's ubiquitous language and shared definitions that every
layer depends on and none owns — the ontologies (factor/feature), shared vocabulary, enums, and
value-object definitions used to keep names and meaning consistent (KM-3, NM-1).

## Scope
Technology-independent definitions and vocabularies only. This is distinct from `packages/`
(reusable **libraries/behavior**) and `contracts/` (interface **schemas**); `shared/` holds the
shared **meaning** those depend on.

## Members
- `ontologies/` — factor and feature ontologies (the shared classification vocabulary).
- `vocabulary/` — the ubiquitous language / glossary of domain terms.
- `enums/` — shared enumerations and value-object definitions.

## Allowed Contents
Ontology, vocabulary, and enumeration definition skeletons; documentation.

## Forbidden Contents
Behavior, business logic, or algorithms; asset-class-specific names in the core (NM-4, CP-8);
duplication of contract schemas (owned by `contracts/`).

## Ownership
Accountable role: ARB / PE (with domain leads for their ontologies). Architecture owner: ARB.

## Dependencies
Depends on nothing (innermost kernel). `contracts/`, `packages/`, and services depend on it.

## Related Governance Documents
CLAUDE.md (KM-1..3, NM-1..4); Architecture V2 §5.5 (ontologies); Implementation Roadmap.
EOF

mk "scripts" <<'EOF'
# scripts/ — Operational & Developer Scripts

> **Phase 0 scaffolding placeholder.** Structure only.

## Purpose
Repeatable, auditable developer and operational scripts (setup, checks, generators). Scripts are
part of the auditable build (IMP-7) and MUST NOT embed secrets or bypass governance gates.

## Scope
Automation only. Nothing here makes a consequential decision or touches capital.

## Allowed Contents
Setup/bootstrap, verification, and code-generation script skeletons; documentation.

## Forbidden Contents
Secrets or credentials (SEC-3, CODE-29); ambient production side-effects; anything that
bypasses a governance gate or the release gates.

## Ownership
Accountable role: PE. Architecture owner: ARB.

## Dependencies
May invoke `tools/` and `packages/`; depended on by no runtime component.

## Related Governance Documents
CLAUDE.md (GIT-1..5, SEC-3); RB-20 · CODE; Implementation Roadmap Phase 0.
EOF

mk "configs" <<'EOF'
# configs/ — Configuration & Environment Separation

> **Phase 0 scaffolding placeholder.** Structure only — no secrets.

## Purpose
Technology-independent configuration and **environment separation** with a
**secrets-by-reference** model: configuration is declared and versioned; secrets are brokered by
reference and never stored in the repository (SEC-3, CODE-29, FB-14).

## Scope
Configuration schemas and per-environment values (references only). Distinct from
`deployment/` (how the platform is deployed) and `infrastructure/` (what it runs on).

## Members
- `environments/development/`, `environments/staging/`, `environments/production/`
- `schema/` — configuration schema definitions and validation.

## Allowed Contents
Config schema skeletons; non-secret per-environment value placeholders; secret **references**;
documentation.

## Forbidden Contents
Any secret, credential, or token value (FB-14, SEC-3); environment-coupling that prevents
independent promotion; raw vendor data.

## Ownership
Accountable role: PE / HSRE; secrets brokering: CISO. Architecture owner: ARB.

## Dependencies
Consumed by `packages/configuration`; depends on `packages/security` for secret references.

## Related Governance Documents
CLAUDE.md (SEC-1..4, DEP-1); Architecture V2 §6.5; RB-27 · SEC; Implementation Roadmap Phase 0.
EOF

mk "tests" <<'EOF'
# tests/ — Cross-Cutting Test Suites

> **Phase 0 scaffolding placeholder.** Structure only — no tests yet.

## Purpose
Cross-cutting and system-level test suites that enforce the platform's guarantees:
golden-set tests for deterministic decision engines (CS-2, VS-1), conformance tests for
governance invariants, and integration/e2e tests across bounded contexts. Module-local unit
tests live beside their code.

## Scope
Tests that span more than one module, plus the golden and conformance suites that must never
regress. Every deliverable must be testable in isolation (IMP-6).

## Members
- `unit/` — shared unit-test scaffolding/fixtures.
- `integration/` — cross-service/contract integration tests.
- `golden/` — golden-set tests for deterministic engines (hard gate).
- `conformance/` — Architecture V2 / rulebook invariant conformance tests.
- `e2e/` — end-to-end staged-chain tests.

## Allowed Contents
Test scaffolding, fixtures, and harness placeholders; documentation.

## Forbidden Contents
Non-deterministic tests of decision engines; tests that read non-as-of data; fixtures
containing secrets or raw vendor data.

## Ownership
Accountable role: PE. Architecture owner: ARB.

## Dependencies
Depends on the modules under test via their contracts; depended on by CI quality gates.

## Related Governance Documents
CLAUDE.md (CS-2, VS-1, CR-2); Architecture V2 §12 (conformance); RB-21 · TEST; Implementation
Roadmap Part F (quality gates).
EOF

mk "infrastructure" <<'EOF'
# infrastructure/ — Infrastructure Definitions

> **Phase 0 scaffolding placeholder.** Structure only — technology-independent.

## Purpose
Technology-independent definitions of the platform's runtime substrate: the message bus
(partitioned topics + ACLs), artifact/temporal stores, identity, and the reproducibility/
observability backbone — described as capabilities behind contracts, never as a specific vendor
(AV2-12, IMP-9).

## Scope
Infrastructure capability definitions and topology, vendor-neutral. Distinct from
`deployment/` (release/rollout) and `configs/` (values).

## Allowed Contents
Capability/topology definition skeletons (bus topics + ACLs, stores, identity/RBAC);
documentation.

## Forbidden Contents
Vendor-locked core logic (AV2-12); secrets; a message bus without partitioning/ACLs (SC-3);
"immutable forever, hot forever" storage without lifecycle (AP-8, SC-2).

## Ownership
Accountable role: HSRE. Architecture owner: ARB.

## Dependencies
Underpins all layers via the cross-cutting spines; depends on nothing above it. Built in
**Phase 1** (substrate), extended per phase.

## Related Governance Documents
CLAUDE.md (SC-1..4, AV2-12); Architecture V2 §5.10, §10; P5-04; Implementation Roadmap Phase 1.
EOF

mk "deployment" <<'EOF'
# deployment/ — Deployment & Release

> **Phase 0 scaffolding placeholder.** Structure only.

## Purpose
Technology-independent definitions for how the platform is released and rolled out —
**paper-first by default**, live only through a governance authorization token and the release
gates (DEP-1..4). Deployment is reversible (DEP-3).

## Scope
Release/rollout definitions, environment promotion, and rollback. Distinct from
`infrastructure/` (the substrate) and `configs/` (values). Built in **Phase 8**.

## Allowed Contents
Release/rollout and rollback definition skeletons; environment-promotion placeholders;
documentation of the First-Capital and Live-Capital gates.

## Forbidden Contents
Any path to live capital that bypasses the release gates (IMP-29, FB-12); irreversible
deployment (DEP-3); AI authorizing execution/deployment (AI-1..4).

## Ownership
Accountable role: HSRE / HPR; capital-affecting releases require GRC human sign-off. Architecture
owner: ARB.

## Dependencies
Depends on all prior phases and the deterministic core; gated by the Patch Plan §5 release gates.

## Related Governance Documents
CLAUDE.md (DEP-1..4, RS-4, HO-2); Architecture V2 §5.9; RB-30 · DEPLOY; Execution Governance;
Implementation Roadmap Phase 8 / IMP-29.
EOF

mk "tools" <<'EOF'
# tools/ — Developer & Governance Tooling

> **Phase 0 scaffolding placeholder.** Structure only.

## Purpose
Supporting tooling for developers and governance: scaffolding generators, contract/reference
linters, and CI gate helpers that enforce the governance gates (RB-20..27) technology-
independently. Tools support the build; they are not part of the runtime.

## Scope
Build-time and governance tooling. The Phase 0 scaffolding generator lives here.

## Members
- `scaffolding/` — the Phase 0 repository-foundation generator (this directory's `generate_foundation.sh`).
- `ci/` — technology-independent descriptions of the CI governance gates.

## Allowed Contents
Tool skeletons and generators; gate descriptions; documentation.

## Forbidden Contents
Runtime business logic; secrets; tools that can bypass or disable a governance gate.

## Ownership
Accountable role: PE. Architecture owner: ARB.

## Dependencies
Standalone; may read the governance corpus and repository structure.

## Related Governance Documents
CLAUDE.md (CP-1, CR-1..4); RB-20..27; Implementation Roadmap Phase 0 (CI gates).
EOF

mk "examples" <<'EOF'
# examples/ — Reference Examples

> **Phase 0 scaffolding placeholder.** Structure only.

## Purpose
Reference, non-production examples that demonstrate the **governed patterns** — contract-first
module skeletons, the canonical engineering workflow, and how a deliverable traces to its
governing documents — so contributors build compliant-by-construction modules (IMP-1, IMP-10).

## Scope
Illustrative examples only. Nothing here is a production component, touches capital, or is
depended upon by runtime code.

## Allowed Contents
Reference module/contract skeletons; worked scaffolding examples; documentation.

## Forbidden Contents
Production business logic or algorithms; secrets; anything a runtime component depends on;
examples that violate a governance rule.

## Ownership
Accountable role: PE. Architecture owner: ARB.

## Dependencies
May reference `packages/` and `contracts/`; depended on by nothing.

## Related Governance Documents
CLAUDE.md; Architecture V2; RB-20 · CODE; RB-23 · DOC; Implementation Roadmap Part H.
EOF

# =============================================================================
# SERVICES (leaf READMEs)
# =============================================================================
SVC_ALLOWED='Service contract skeleton; API/interface placeholders; module documentation'
SVC_FORBIDDEN='Business logic or algorithms in Phase 0; asset-class branching in a core service (CP-8); data reads outside the As-Of Gateway (PIT-1); any LLM in a decision or execution path (AI-1); hidden cross-service coupling (SE-2)'

while IFS='|' read -r name title purpose owner arch phase deps gov; do
  [ -z "$name" ] && continue
  leaf "services/$name" "$title" "$purpose" "$owner" "$arch" "$phase" "$deps" "$gov" "$SVC_ALLOWED" "$SVC_FORBIDDEN"
  : > "services/$name/service.contract.placeholder.md"
done <<'DATA'
research-service|Research Service|Host the research lifecycle scaffolding — idea, hypothesis, and experiment registration, pre-registration lock, and the research journal. Proposes and records candidates; it never adjudicates significance or acceptance.|HQ|Research Intelligence Layer (Architecture V2 §5.5)|Phase 3|packages/research-sdk; dataset-service (as-of); the deterministic engines for promotion|RB-02 · RMET; Experiment Tracking Governance; the six Registries; P3-01..08
dataset-service|Dataset Service|Serve certified, point-in-time, provenance-bearing data exclusively through the As-Of Gateway (sole read path, fail-closed); own ingestion, the immutable raw vault, canonicalization, the vintage store, certification, and lineage.|HD|Data Platform Layer (Architecture V2 §5.8)|Phase 2|packages/data-sdk; the clock and artifact registry (Phase 1)|RB-06/07 · DATA; RB-08 · PIT; Dataset Governance; P1-01
feature-service|Feature Service|Own the PIT-bound Feature Factory and Feature Marketplace — declarative feature definitions computed only through the as-of path, cleared by the Leakage Harness, carrying full provenance.|HD / HQ|Data Platform and Research Intelligence Layers (Architecture V2 §5.8/§5.5)|Phase 3|dataset-service (As-Of Gateway); the Leakage Harness|Feature Registry; RB-09/10 · FAR; P1-06, P2-03
signal-service|Signal Service|Own the signal generation lifecycle and Signal Registry — register-before-use, net-of-cost defined signals, isolated from validation feedback.|HQ|Research Intelligence Layer (Architecture V2 §5.5)|Phase 3|feature-service; the deterministic engines (gates)|Signal Registry; RB-09/10 · FAR; P2-07
strategy-service|Strategy Service|Own the strategy lifecycle and Strategy Registry — including a defined retirement, not only a birth; consumes signals and defers all promotion to the deterministic engines.|HQ / HPR|Research Intelligence Layer (Architecture V2 §5.5)|Phase 3|signal-service; validation and backtesting services|Strategy Registry; RL-1/2; P2-08/09
portfolio-service|Portfolio Service|Host the deterministic, net-of-cost portfolio optimizer that consumes only capital-eligible alphas bearing a valid scientific-eligibility token, within Risk Layer limits.|HPR|Quantitative Engine Layer (Architecture V2 §5.6)|Phase 4|risk-service (limits); eligible alphas (tokens)|RB-12 · PORT; Portfolio Registry; P1-08
backtesting-service|Backtesting Service|Host the institutional deterministic backtest engine — PIT simulated clock, net-of-cost, participation-aware fills/impact, borrow/availability, corporate actions, and capacity — producing immutable, reproducible artifacts.|HQ|Quantitative Engine Layer (Architecture V2 §5.6)|Phase 4|dataset-service (as-of); the reproducibility spine|RB-11 · BT; P3-16
validation-service|Validation Service|Host the deterministic validation gauntlet (Leakage Harness, purged/embargoed CPCV, PBO), the Holdout and Embargo Manager (one-shot, rotating OOS), the Independent Replication Engine, and the Pre-Capital Scientific Gate that issues capital-eligibility tokens.|GRC|Quantitative Engine Layer (Architecture V2 §5.6)|Phase 4|the Trial Ledger; dataset-service (sealed OOS partition)|RB-01 · STAT; RB-04 · VAL; P2-01..09
risk-service|Risk Service|Host the independent, deterministic risk-limit engine (exposure, leverage, liquidity, concentration, drawdown), real-time monitoring, and the human-invocable, never-AI-gated kill-switch.|HPR|Risk Management Layer (Architecture V2 §5.7)|Phase 4 (extended in Phase 8)|portfolio-service; execution-service|RB-13 · RISK; P1-03, P6-03
execution-service|Execution Service|Host paper-first, token-gated deterministic execution (OMS, algos, adapters), the research-to-production parity harness, position ledger, and reconciliation. Live execution is impossible without a time-boxed governance authorization token.|HPR / HSRE|Execution Layer (Architecture V2 §5.9)|Phase 8|portfolio-service; risk-service; governance authorization token|RB-14 · EXEC; Execution Governance; P3-15, P1-10
monitoring-service|Monitoring Service|Host independent production monitoring, drift and research-to-production parity monitors, cost attribution, and halt integration. Narrates; the risk engine decides halts.|HSRE|Execution Layer and Observability Spine (Architecture V2 §5.9/§5.10)|Phase 8|execution-service; risk-service (halt); the run ledger|Production Monitoring Governance; Incident Response Governance; P3-15, P5-06
DATA

# =============================================================================
# PACKAGES (leaf READMEs)
# =============================================================================
PKG_ALLOWED='Interface/type skeletons; contract bindings; documentation'
PKG_FORBIDDEN='Business logic or algorithms in Phase 0; asset-class branching (CP-8); god-modules or over-generic universal interfaces (AP-5); secrets (SEC-3); ambient time/RNG access (CS-3)'

while IFS='|' read -r name title purpose owner arch phase deps gov; do
  [ -z "$name" ] && continue
  leaf "packages/$name" "$title" "$purpose" "$owner" "$arch" "$phase" "$deps" "$gov" "$PKG_ALLOWED" "$PKG_FORBIDDEN"
  : > "packages/$name/package.placeholder.md"
done <<'DATA'
core-domain|core-domain (package)|The asset-agnostic domain model and ubiquitous language shared across every layer — entities, aggregates, and invariants. No core type branches on asset class (CP-8); asset specifics live behind capability contracts.|ARB / PE|Cross-cutting shared kernel (Architecture V2 §5)|Phase 1|shared/ (ubiquitous language); nothing else (innermost)|CP-8; RB-26 · NAME; P1-07
shared-types|shared-types (package)|Shared value objects, content-addressed/versioned identifiers, and enumerations used across packages and services, so a name uniquely and immutably denotes one artifact version.|PE|Cross-cutting shared kernel (Architecture V2 §5)|Phase 1|shared/enums (definitions); nothing else|NM-2; VER-1
contracts|contracts (package)|Generated and typed bindings for the ratified Tier-4/5, service, API, and domain contracts, so consumers depend on contracts rather than implementations.|ARB|Contracts Spine (Architecture V2 §5.10)|Phase 0/1|contracts/ (definitions); shared-types|IMP-10; P5-02; Agent/Workflow Contracts
utilities|utilities (package)|Pure, side-effect-free helper libraries (formatting, collections, time-as-injected wrappers). Contains no domain decisions.|PE|Cross-cutting (Architecture V2 §5.10)|Phase 1|shared-types|RB-20 · CODE
configuration|configuration (package)|Configuration loading with environment separation and a secrets-by-reference model; never resolves secrets from the repository.|PE / HSRE|Cross-cutting (Architecture V2 §5.10)|Phase 0/1|configs/; security (package)|CODE-29; SEC-3; DEP-1
logging|logging (package)|Structured, audit-grade logging primitives feeding the immutable run ledger and audit trail.|HSRE|Observability Spine (Architecture V2 §5.10)|Phase 1|shared-types|OB-1; AV2 §5.10
observability|observability (package)|Metrics, tracing, run-ledger, and per-idea/experiment/agent cost-attribution primitives.|HSRE|Observability Spine (Architecture V2 §5.10)|Phase 1|logging|P5-06; P1-02; OB-1..4
security|security (package)|Secrets-broker client, least-privilege identity helpers, tamper-evident audit hooks, and untrusted-content quarantine primitives.|CISO|Security Spine (Architecture V2 §6.5)|Phase 1|shared-types|RB-27 · SEC; P1-09, P4-03
validation|validation (package)|Shared structural schema and contract validation primitives — structural only, never statistical significance (which is deterministic-engine territory).|GRC|Cross-cutting (Architecture V2 §5.10)|Phase 1|contracts (package); shared-types|RB-20 · CODE; AI-2 (no LLM significance)
workflow-engine|workflow-engine (package)|The durable workflow / state-machine engine that realizes Tier-5 Workflow Contracts with saga compensation; it orchestrates and never adjudicates.|HSRE|Workflow Control Layer (Architecture V2 §5.4)|Phase 6|contracts (package); observability|Workflow Contracts; WCON-1..3; P5-05
ai-runtime|ai-runtime (package)|The contract-bound agent runtime — model pinning, versioned prompts, provenance recording, default-deny tools, and isolation-aware, advisory-only execution. AI is never in a decision path.|HAI|Agent and AI Orchestration Layers (Architecture V2 §5.2/§5.3)|Phase 5|security; observability; the deterministic engines it defers to|RB-15 · AIGOV; Agent Contracts; Agent Registry; P4-01/03, P2-07
research-sdk|research-sdk (package)|Client SDK for the research services and registries — register-before-run, pre-registration, and Trial-Ledger enrollment helpers. Proposes; never adjudicates.|HQ|Research Intelligence Layer (Architecture V2 §5.5)|Phase 3|contracts (package); data-sdk|RB-02 · RMET; the six Registries
data-sdk|data-sdk (package)|Client SDK for the As-Of Gateway — every historical read carries an explicit as_of and fails closed without one.|HD|Data Platform Layer (Architecture V2 §5.8)|Phase 2|contracts (package); shared-types|RB-08 · PIT; P1-01
DATA

# =============================================================================
# APPS (leaf READMEs)
# =============================================================================
APP_ALLOWED='UI application skeleton; API-client bindings to service contracts; documentation'
APP_FORBIDDEN='Any decision, validation, risk, allocation, or execution logic; any back-door around a governed API or gate; direct database or engine access'

while IFS='|' read -r name title purpose owner arch phase deps gov; do
  [ -z "$name" ] && continue
  leaf "apps/$name" "$title" "$purpose" "$owner" "$arch" "$phase" "$deps" "$gov" "$APP_ALLOWED" "$APP_FORBIDDEN"
done <<'DATA'
research-ui|Research UI|Human console surfacing the registries, experiments, hypotheses, and deterministic verdicts; lets researchers propose and track — never adjudicate.|PE|User Applications (Architecture V2 §5.9 boundary)|Phase 7|research-service; validation-service (read); contracts/api|RB-23 · DOC; Architecture V2 §6.2
admin-ui|Admin UI|Administration and governance console: ownership, lifecycle, approvals, and sign-offs — enforcing human accountability and counter-sign for capital-affecting actions.|GRC / PE|User Applications (Architecture V2 §5.1/§5.9)|Phase 7|all governed service APIs; contracts/api|HO-1..4; P5-05; Architecture V2 §6.2
monitoring-ui|Monitoring UI|Human console for production monitoring, drift/parity, alerting, and incident visibility; surfaces halt state (the risk engine decides halts).|HSRE|User Applications (Architecture V2 §5.9)|Phase 7|monitoring-service; risk-service (read); contracts/api|Production Monitoring Governance; Incident Response Governance
docs-portal|Documentation Portal|The governance and documentation portal presenting the constitution, architecture, rulebooks, registries, and module index to humans.|PE|User Applications (Architecture V2 §5.9)|Phase 7|docs/; contracts/api|RB-23 · DOC; DOC-1..4
DATA

# =============================================================================
# AGENTS (category dirs + per-agent leaf READMEs)
# =============================================================================
while IFS='|' read -r cat catname; do
  [ -z "$cat" ] && continue
  mkdir -p "agents/$cat"; touch "agents/$cat/.gitkeep"
  cat > "agents/$cat/README.md" <<EOF
# agents/$cat — $catname agents

> **Phase 0 scaffolding placeholder.** Directory only — agents are implemented in **Phase 5**,
> after the deterministic core exists for them to defer to (IMP-3).

## Purpose
Registry category directory for **$catname** agents. Each sub-directory is one
registered agent (\`AGT-<CAT>-<nnn>\`) whose authoritative specification is its Tier-4 Agent
Contract and whose existence/status is governed by the AI Agent Registry.

## Ownership
Per the AI Agent Registry (each agent has a named human owner); registry system owner: HAI.

## Allowed / Forbidden
Documentation and runtime-binding placeholders only. No decision/approval/execution logic;
generation categories get no OOS/validation access (isolation barrier, P2-07).

## Related Governance Documents
CLAUDE.md (AI-1..8); Architecture V2 §5.3; RB-15 · AIGOV; Agent Registry; Agent Contracts.
EOF
done <<'DATA'
research-discovery|Research (discovery)
feature-discovery|Feature Discovery
analysis|Analysis
validation-narrator|Validation (narrator)
risk-narrator|Risk (analysis / narrator)
portfolio-narrator|Portfolio (analysis / narrator)
documentation|Documentation
engineering|Engineering
monitoring-narrator|Monitoring
DATA

# per-agent: dir|name|catdir|authority|trust|owner|workflow
while IFS='|' read -r id name catdir authority trust owner workflow; do
  [ -z "$id" ] && continue
  d="agents/$catdir/$id"
  mkdir -p "$d"; touch "$d/.gitkeep"
  cat > "$d/README.md" <<EOF
# $id · $name

> **Phase 0 scaffolding placeholder.** Not implemented — agents are built in **Phase 5**.

## Purpose
Registered agent **$name**. Authoritative spec: its Tier-4 Agent Contract. Existence/status:
the AI Agent Registry entry \`$id\`.

## Governance Summary (from the AI Agent Registry — the registry/contract govern)
- **Authority:** $authority (never \`decide\`, AGC-9 / REG-9).
- **Trust level:** $trust.
- **Owner:** $owner.
- **Workflow participation:** $workflow.

## Allowed Contents
Documentation pointing to the registry entry and Tier-4 contract; a placeholder for the
Phase-5 \`packages/ai-runtime\` binding.

## Forbidden Contents
Any decision/approval/execution logic (AI-1..4); self-modifying its contract or escalating its
authority (REG-22/23); for generation agents, any access to OOS/holdout or validation outcomes
(AI-5, isolation barrier P2-07); implementation before Phase 4 completes (IMP-19).

## Related Governance Documents
CLAUDE.md (AI-1..8, AG-1..4); Architecture V2 §5.3; RB-15 · AIGOV; AI Agent Registry ($id);
Agent Contracts (Tier-4); AI Agent Evaluation Framework.
EOF
done <<'DATA'
AGT-RD-001|Research Discovery Agent|research-discovery|propose|T3|HQ|WFC-43
AGT-RD-002|Literature Miner|research-discovery|propose|T2|HQ|WFC-43
AGT-RD-003|Company Researcher|research-discovery|propose|T2|HQ|WFC-43
AGT-RD-004|Research Director (proposer)|research-discovery|propose|T2|HQ|orchestration
AGT-FD-001|Feature Engineering Agent|feature-discovery|propose|T3|HQ|WFC-44
AGT-FD-002|Factor Search Agent|feature-discovery|propose|T2|HQ|WFC-44
AGT-AN-001|Backtesting Agent|analysis|propose|T3|HQ|WFC-45
AGT-VN-001|Validation Narrator|validation-narrator|narrate|T2|GRC|WFC-46
AGT-RN-001|Risk Analysis Agent|risk-narrator|narrate|T2|HPR|WFC-47
AGT-PN-001|Portfolio Analysis Agent|portfolio-narrator|narrate|T2|HPR|WFC-48
AGT-DO-001|Documentation Agent|documentation|propose|T2|PE|all workflows
AGT-EN-001|Engineering Agent|engineering|propose|T2|PE|engineering workflows
AGT-MO-001|Monitoring Narrator|monitoring-narrator|narrate|T2|HSRE|WFC-49
DATA

# =============================================================================
# WORKFLOWS (leaf READMEs)
# =============================================================================
WF_ALLOWED='Versioned workflow-definition skeleton; state/transition/gate placeholders; documentation'
WF_FORBIDDEN='Decision logic embedded in the workflow (WCON-2); undeclared transitions or stage-skipping (WFC-16); moving research directly to production (WFC-3); an AI approving its own output (WFC-27)'

while IFS='|' read -r name title purpose owner deps gov; do
  [ -z "$name" ] && continue
  leaf "workflows/$name" "$title" "$purpose" "$owner" "Workflow Control Layer (Architecture V2 §5.4)" "Phase 6" "$deps" "$gov" "$WF_ALLOWED" "$WF_FORBIDDEN"
  : > "workflows/$name/workflow.contract.placeholder.md"
done <<'DATA'
research-discovery|Research Discovery Workflow (WFC-43)|Orchestrate the idea-to-registered-hypothesis stages, gating each transition on its owning deterministic gate or human approval.|HQ|packages/workflow-engine; research-service; research-discovery agents|Workflow Contracts (WFC-43); RB-02 · RMET
feature-research|Feature Research Workflow (WFC-44)|Orchestrate feature definition through the Leakage Harness and acceptance gates.|HQ|feature-service; the Leakage Harness|Workflow Contracts (WFC-44); P1-06, P2-03
backtesting|Backtesting Workflow (WFC-45)|Orchestrate configuration and execution of the deterministic backtest engine and capture of its immutable artifact.|HQ|backtesting-service|Workflow Contracts (WFC-45); RB-11 · BT
validation|Validation Workflow (WFC-46)|Orchestrate the deterministic validation gauntlet, one-shot holdout, replication, and the scientific gate that issues capital-eligibility tokens.|GRC|validation-service; the Trial Ledger|Workflow Contracts (WFC-46); P2-05..09
risk-review|Risk Review Workflow (WFC-47)|Orchestrate independent risk analytics and the independent risk sign-off at promotion.|HPR|risk-service|Workflow Contracts (WFC-47); RB-13 · RISK
portfolio-construction|Portfolio Construction Workflow (WFC-48)|Orchestrate deterministic, net-of-cost portfolio construction from eligible alphas within risk limits.|HPR|portfolio-service; risk-service|Workflow Contracts (WFC-48); RB-12 · PORT
production-deployment|Production Deployment Workflow (WFC-49)|Orchestrate the staged, human-approved, token-gated path to paper-first and then live deployment.|HSRE|execution-service; human governance approvals|Workflow Contracts (WFC-49); Execution Governance; IMP-29
DATA

# =============================================================================
# CONTRACTS sub-directories (leaf READMEs)
# =============================================================================
CON_ALLOWED='Versioned, semantically-versioned contract/schema skeletons; documentation'
CON_FORBIDDEN='Implementations or business logic; a single global monolithic schema (P5-02); breaking a published contract without a major-version bump and governed migration (VER-1/2)'

while IFS='|' read -r name title purpose owner gov; do
  [ -z "$name" ] && continue
  leaf "contracts/$name" "$title" "$purpose" "$owner" "Contracts Spine (Architecture V2 §5.10)" "Phase 0/1" "shared/; packages/shared-types" "$gov" "$CON_ALLOWED" "$CON_FORBIDDEN"
done <<'DATA'
agent_io|contracts/agent_io — Tier-4 Agent I/O Contracts|Artifact location for the Tier-4 agent input/output contracts (per CLAUDE.md Table of Authority). The governing framework is docs/contracts/agent_contracts.md.|HAI / ARB|Agent Contracts (Tier-4); RB-15 · AIGOV; P4-02
workflows|contracts/workflows — Tier-5 Workflow Contracts|Artifact location for the Tier-5 workflow contracts (per CLAUDE.md Table of Authority). The governing framework is docs/contracts/workflow_contracts.md.|HSRE / ARB|Workflow Contracts (Tier-5); WCON-1..3
services|contracts/services — Service Contracts|Service-to-service (bounded-context) contracts; the decomposed contract waist that MUST NOT re-monolithize.|ARB|SE-2/3; P5-02; Architecture V2 §5.10
api|contracts/api — External / Application API Contracts|The human/application-facing API contracts consumed by apps/; the only way UIs may act on the platform.|PE / ARB|Architecture V2 §5.9/§6.2; RB-23 · DOC
domain|contracts/domain — Domain Contracts|Shared domain contracts and value-object schemas expressing the ubiquitous language as stable interfaces.|ARB|CP-8; RB-26 · NAME; P1-07
DATA

# =============================================================================
# SHARED sub-directories
# =============================================================================
SH_ALLOWED='Definition skeletons (ontology / vocabulary / enum) and documentation'
SH_FORBIDDEN='Behavior, business logic, or algorithms; asset-class-specific names in the core (NM-4, CP-8); duplication of contract schemas'
while IFS='|' read -r name title purpose gov; do
  [ -z "$name" ] && continue
  leaf "shared/$name" "$title" "$purpose" "ARB / PE" "Cross-cutting shared kernel (Architecture V2 §5)" "Phase 1" "nothing (innermost kernel)" "$gov" "$SH_ALLOWED" "$SH_FORBIDDEN"
done <<'DATA'
ontologies|shared/ontologies — Factor & Feature Ontologies|The shared classification vocabulary in which new features and factors MUST be classified (KM-3); prevents factor-zoo redundancy.|KM-1..3; RB-09/10 · FAR; P3-06
vocabulary|shared/vocabulary — Ubiquitous Language|The shared glossary of domain terms so names reflect single responsibility and domain meaning consistently.|NM-1..4; RB-26 · NAME
enums|shared/enums — Shared Enumerations & Value Objects|Shared enumerations and value-object definitions with content-addressed/versioned identity.|NM-2; VER-1
DATA

# =============================================================================
# CONFIGS, TESTS, INFRASTRUCTURE, DEPLOYMENT, TOOLS sub-directories
# =============================================================================
mkdir -p configs/environments/development configs/environments/staging configs/environments/production configs/schema
for e in development staging production; do
  touch "configs/environments/$e/.gitkeep" "configs/environments/$e/.env.reference.example"
  cat > "configs/environments/$e/README.md" <<EOF
# configs/environments/$e

> **Phase 0 scaffolding placeholder.** No secrets — secrets are brokered by reference.

Per-environment configuration for the **$e** environment. Holds non-secret values and secret
**references** only. Environments are independently promotable (DEP-1, paper-first).
See \`configs/README.md\`. Governed by CLAUDE.md SEC-3, CODE-29; RB-27 · SEC.
EOF
done
touch configs/schema/.gitkeep
cat > configs/schema/README.md <<'EOF'
# configs/schema

> **Phase 0 scaffolding placeholder.**

Configuration schema definitions and validation for all environments. A config value is valid
only against its schema. No secret values here. Governed by RB-27 · SEC; RB-20 · CODE.
EOF

for t in unit integration golden conformance e2e; do
  mkdir -p "tests/$t"; touch "tests/$t/.gitkeep"
done
cat > tests/golden/README.md <<'EOF'
# tests/golden

> **Phase 0 scaffolding placeholder.**

Golden-set tests for the deterministic decision engines (statistics, validation, backtest, risk,
portfolio). This is a **hard** quality gate (IMP-26): a decision engine without golden tests is
not accepted. Tests are deterministic and reproducible from manifests. Governed by CS-2, VS-1,
DE-2; RB-21 · TEST; P1-03.
EOF
cat > tests/conformance/README.md <<'EOF'
# tests/conformance

> **Phase 0 scaffolding placeholder.**

Conformance tests for Architecture V2 invariants and rulebook rules (the §12 conformance
checklist): As-Of Gateway sole read path, no LLM in decision paths, isolation barrier, run
manifests, staged chain. Governed by AV2-40; CP-1; RB-21 · TEST.
EOF

for i in bus artifact-store identity temporal-store; do
  mkdir -p "infrastructure/$i"; touch "infrastructure/$i/.gitkeep"
done
cat > infrastructure/bus/README.md <<'EOF'
# infrastructure/bus

> **Phase 0 scaffolding placeholder.** Technology-independent.

The message bus definition: domain-partitioned topics with **ACLs** enforcing the
generator-vs-validator isolation barrier (P2-07, P5-04). Agents communicate only via the bus and
immutable artifact references (AC-1). Governed by SC-3; Architecture V2 §5.2/§5.10.
EOF

for d in release rollback environment-promotion; do
  mkdir -p "deployment/$d"; touch "deployment/$d/.gitkeep"
done

mkdir -p tools/ci
cat > tools/ci/README.md <<'EOF'
# tools/ci — Governance CI Gates (technology-independent)

> **Phase 0 scaffolding placeholder.** Describes the gates; does not bind a specific CI vendor.

The CI governance gates a change MUST pass before merge (Implementation Roadmap Part E/F):
- **Contract / Architecture** — architectural home + ADR/Patch reference; conforms to Architecture V2 (RB-25 · ADR, ARB).
- **Coding / Review** — SRP, coupling, dependency direction; independent review (RB-20, RB-22; CR-1..4).
- **Testing** — required tests incl. golden-set for decision engines (RB-21).
- **Documentation** — governing docs cited; references resolve (RB-23).
- **Security** — secret-scan clean; deps scanned; no secrets in repo (RB-27 · SEC, CODE-29).
- **AI Review** — if AI-touched: AIGOV limits, provenance, isolation (RB-15).
- **Reproducibility** — reproducible from manifest (RB-05, P1-02).

Hard gates (no compensation): Deterministic, Statistical, Reproducibility (IMP-26). A failed or
skipped required gate blocks merge and is fail-closed (IMP-E-1, CR-4).
EOF

# =============================================================================
# DATASETS / EXPERIMENTS / FEATURES / SIGNALS / STRATEGIES / PORTFOLIOS registry stubs
# =============================================================================
for r in datasets experiments features signals strategies portfolios; do
  mkdir -p "$r/_registry"; touch "$r/_registry/.gitkeep" "$r/_registry/registry.placeholder.md"
done

# =============================================================================
# docs/adr (ADR repository) and docs/repository (root docs home)
# =============================================================================
mkdir -p docs/adr docs/repository
touch docs/repository/.gitkeep
cat > docs/adr/README.md <<'EOF'
# docs/adr — Architecture Decision Records

> **Phase 0 deliverable: the ADR repository is live.**

Every non-trivial or non-obvious decision affecting correctness, architecture, or research
validity MUST be captured as an ADR here (DOC-2, ADR-1..4). ADRs are **immutable once accepted**;
a superseded ADR is marked superseded, never edited. Any deviation from the Patch Plan or this
roadmap MUST be recorded as an ADR citing the affected Patch/Phase IDs (ADR-3, IMP-W-3).

The ADR **governance rules** are owned by `docs/architecture/adr/adr_governance.md` (RB-25 · ADR)
and are not restated here. Use `0000-template.md` to start a new ADR; number sequentially.

Governed by: CLAUDE.md (ADR-1..4, AM-1..4); ADR Governance; Architecture V2 §9.
EOF
cat > docs/adr/0000-template.md <<'EOF'
# ADR-0000 — <title>

| Field | Value |
|---|---|
| Status | PROPOSED / ACCEPTED / SUPERSEDED |
| Date | YYYY-MM-DD |
| Deciders | <roles> |
| Patch / Phase refs | <P#-##, Phase #> |
| Supersedes / Superseded-by | <ADR id or —> |

## Context
<The forces at play; the constitutional/architecture references this decision depends on (ADR-2).>

## Decision
<The decision made.>

## Alternatives Considered
<Options weighed and why they were rejected.>

## Consequences
<Positive, negative, and follow-on obligations; impact on invariants and the Architecture Canon.>

## References
<CLAUDE.md clauses; Architecture V2 sections; rulebooks; Patch IDs. All references MUST resolve (DOC-4).>
EOF

echo "Phase 0 foundation generated."
