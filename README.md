# Institutional Quantitative Research Platform

> **A reproducible, statistically honest, machine-scale scientific institution** for discovering,
> validating, retiring, and deploying quantitative alpha — such that every conclusion is
> trustworthy enough to steward institutional capital.

This repository is governed, top to bottom, by a written constitution and an architecture canon.
The unit of value is the **validated hypothesis with an unbroken evidence trail**, not the trade.

---

## Status — Phase 0: Repository Foundation

This is the **Phase 0** deliverable of the [Implementation Roadmap](docs/implementation/implementation_roadmap.md):
the governed repository skeleton on which every future module is built. It contains
**structure, contracts, placeholders, and documentation only** — no business logic, no
quantitative algorithms, and no application code (Roadmap Phase 0; IMP-1).

Later construction proceeds **governance-first, contract-first, deterministic-core-before-AI,
and capital-safe**, phase by phase, each gated (Roadmap Part C).

## The one rule that explains all the others

**AI proposes and narrates. Deterministic engines decide and execute. Humans are accountable and
approve.** This authority spine (Architecture V2 §4) crosses every layer and is enforced by
mechanism, never by intention (CP-1). No LLM is ever in a decision or execution path (AI-1..4).

## Repository map (top level)

| Directory                                                                                                                                                                   | Responsibility                                                                  | Layer / Phase               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------- |
| [`apps/`](apps/)                                                                                                                                                            | Human consoles (research, admin, monitoring, docs) — act only via governed APIs | UI · Phase 7                |
| [`services/`](services/)                                                                                                                                                    | Bounded-context backend services, one per Architecture V2 component             | Layers 5–9 · Phases 2–8     |
| [`packages/`](packages/)                                                                                                                                                    | Shared libraries & SDKs (domain, spines, runtimes)                              | Cross-cutting · Phases 0–6  |
| [`agents/`](agents/)                                                                                                                                                        | Registered, contract-bound AI agents (propose/narrate only)                     | Layer 3 · Phase 5           |
| [`contracts/`](contracts/)                                                                                                                                                  | The contract registry (agent_io, workflows, services, api, domain)              | Contracts Spine · Phase 0/1 |
| [`workflows/`](workflows/)                                                                                                                                                  | Tier-5 workflow definitions (orchestrate, never adjudicate)                     | Layer 4 · Phase 6           |
| [`datasets/`](datasets/) · [`features/`](features/) · [`signals/`](signals/) · [`strategies/`](strategies/) · [`portfolios/`](portfolios/) · [`experiments/`](experiments/) | Registry-governed research artifacts (immutable, provenance-bearing)            | Layers 5–6 · Phases 2–4     |
| [`shared/`](shared/)                                                                                                                                                        | Shared kernel: ontologies, vocabulary, enums (ubiquitous language)              | Cross-cutting · Phase 1     |
| [`configs/`](configs/)                                                                                                                                                      | Configuration & environment separation (secrets by reference)                   | Cross-cutting · Phase 0     |
| [`infrastructure/`](infrastructure/)                                                                                                                                        | Vendor-neutral substrate (bus+ACLs, stores, identity)                           | Cross-cutting · Phase 1     |
| [`deployment/`](deployment/)                                                                                                                                                | Paper-first, token-gated release & rollback                                     | Layer 9 · Phase 8           |
| [`tests/`](tests/)                                                                                                                                                          | Golden, conformance, integration, e2e suites                                    | Cross-cutting               |
| [`tools/`](tools/) · [`scripts/`](scripts/) · [`examples/`](examples/)                                                                                                      | Build tooling, automation, reference patterns                                   | Build-time                  |
| [`docs/`](docs/)                                                                                                                                                            | The governance corpus (constitution, architecture, rulebooks, registries)       | Tiers 1–5                   |

## Where to start

- **Governance** → [`CLAUDE.md`](CLAUDE.md) (the Constitution) and the [Governance Index](docs/repository/GOVERNANCE_INDEX.md).
- **What the system is** → [Architecture V2](docs/architecture/architecture_v2.md) and the [Architecture Map](docs/repository/ARCHITECTURE_MAP.md).
- **Where things live** → the [Directory Map](docs/repository/DIRECTORY_MAP.md).
- **How to build & contribute** → the [Development Guide](docs/repository/DEVELOPMENT_GUIDE.md) and [CONTRIBUTING](CONTRIBUTING.md).
- **What gets built, in order** → the [Implementation Roadmap](docs/implementation/implementation_roadmap.md) and [Module Index](docs/repository/MODULE_INDEX.md).

## Non-negotiables (a partial list)

- Every historical read passes the **As-Of Gateway** with an explicit `as_of`, fail-closed (PIT-1).
- Every trial is recorded in the **Trial Ledger** before it runs; significance is **deflated** (SI-1..4).
- Every deterministic result is **reproducible from its manifest** (CP-4); every AI step is recorded (RP-3).
- No factor consumes capital without an independently-replicated **capital-eligibility token** and the **First-Capital Gate** (RG-1, IMP-29).
- No secrets or raw vendor data in the repository, ever (FB-14).

## Document authority

`CLAUDE.md` is supreme. Where any document, workflow, or line of code conflicts with it, the
Constitution prevails and the conflicting artifact is void until reconciled by an accepted ADR.
