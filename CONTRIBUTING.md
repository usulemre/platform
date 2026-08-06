# Contributing

> This repository is the working surface of a governed research institution. Contribution is a
> **governed act**: every change traces to the governance corpus and passes deterministic gates
> before merge. Read this before your first change.

- **Governed by:** [CLAUDE.md](CLAUDE.md); RB-20 · CODE, RB-22 · REVIEW, RB-23 · DOC, RB-24 · GIT, RB-25 · ADR.
- **Full workflow & gates:** see the [Development Guide](docs/repository/DEVELOPMENT_GUIDE.md).

## Before you write anything

1. Read [`CLAUDE.md`](CLAUDE.md) (the Constitution), then [Architecture V2](docs/architecture/architecture_v2.md).
2. Find your module's home in the [Directory Map](docs/repository/DIRECTORY_MAP.md) and its governing docs in the [Governance Index](docs/repository/GOVERNANCE_INDEX.md).
3. Confirm the build order allows it now — the [Implementation Roadmap](docs/implementation/implementation_roadmap.md) governs _what is built, in what order_. Do not build a dependent before its foundation's guarantees are enforced (IMP-20).

## The rules that will get a PR rejected (non-exhaustive)

- **AI in a decision path.** LLMs never decide significance, risk, allocation, promotion, or execution (AI-1..4, FB-1..4). AI proposes and narrates only.
- **A read without `as_of`.** All historical reads go through the As-Of Gateway, fail-closed (PIT-1, FB-6).
- **An unregistered trial or experiment.** Register (and Trial-Ledger-link) before running (FB-5).
- **P-hacking.** No post-hoc change of success criteria; no undeflated significance (FB-8, SI-3).
- **Prose guarantees without enforcement.** Every guarantee needs a mechanism + a test (CP-1, CR-3).
- **Secrets or raw vendor data in the repo** (FB-14, GIT-5).
- **Hidden coupling / god-modules / asset-class branching in core** (SE-2, AP-5, CP-8).
- **Business logic in Phase 0.** This phase is structure only.

## How to contribute a change

1. **Branch.** Never commit to the default branch (GIT-1). One atomic logical change per commit (GIT-2).
2. **Contract first.** If your module needs a new interface, ratify the contract in `contracts/` before implementing it (IMP-10).
3. **Meet Definition of Ready**, build through the [canonical workflow](docs/repository/DEVELOPMENT_GUIDE.md), and **meet Definition of Done** — all gates green.
4. **Cite governance.** Every module and PR references its governing documents; every reference must resolve (DOC-4). Architecture-affecting changes cite a Patch ID + ADR (GIT-3).
5. **Record decisions.** Non-obvious correctness/architecture/validity decisions become ADRs in [`docs/adr/`](docs/adr/) (DOC-2).
6. **Open a reviewed PR.** At least one independent reviewer; capital-affecting changes require independent counter-sign (CR-1). Reviewers verify constitutional compliance and must reject prose-only guarantees (CR-2, CR-3).

## AI contributors

AI agents contributing code operate under their Tier-4 [Agent Contracts](docs/contracts/agent_contracts.md)
and the [AI Governance rulebook](docs/rulebooks/ai_governance.md): label AI-generated sections,
include tests, never weaken validation/security, never alter deterministic decision engines
without human review, and never merge without review (per the Engineering Agent's contract).

## Getting set up

This is **not yet a git repository**. To begin: initialize git, create a working branch, and read
the [Development Guide](docs/repository/DEVELOPMENT_GUIDE.md). The repository foundation is
regenerated (not hand-edited) via
[`tools/scaffolding/generate_foundation.sh`](tools/scaffolding/generate_foundation.sh).

## Where to ask

Ownership is recorded per directory (each `README.md`) and in the [Module Index](docs/repository/MODULE_INDEX.md).
Route questions to the accountable role; architecture questions go to the ARB.
