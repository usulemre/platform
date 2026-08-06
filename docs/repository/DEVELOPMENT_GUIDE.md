# Development Guide

> How to build a module in this repository so it is **compliant by construction**. This guide
> operationalizes the Implementation Roadmap's canonical engineering workflow (Part H) and gates
> (Part E/F). It restates no rules — it sequences them and cites them.

- **Owner:** PE. **Governed by:** [Implementation Roadmap](../implementation/implementation_roadmap.md), RB-20 · CODE, RB-21 · TEST, RB-22 · REVIEW, RB-23 · DOC, RB-24 · GIT, RB-25 · ADR.

## First principles (memorize these)

1. **Governance first.** Code is the lowest tier; it implements governance, never the reverse (IMP-1, CP-1).
2. **Architecture before code.** No module without a ratified Architecture V2 home and, if it changes architecture, an ADR + Patch ID (IMP-2).
3. **Contract first.** Define and ratify the contract before the implementation that honors it (IMP-10).
4. **Deterministic core before AI.** AI is layered only after deterministic engines exist to defer to (IMP-3). AI never decides or executes (AI-1..4).
5. **Foundations before dependents.** PIT/data before research; reproducibility spine before engines (IMP-4, IMP-20).
6. **No secrets, ever.** Secrets are brokered by reference; raw vendor data never enters the repo (SEC-3, FB-14).

## The canonical engineering workflow (do not skip stages — IMP-28)

```
Architecture  →  Implementation  →  Testing  →  Validation  →  Review  →  Approval  →  Deployment  →  Monitoring
 (contract +      (DoR met;         (golden-set  (quality      (indep.    (human;      (correct env;   (continuous)
  home + ADR)      code+tests)       for engines) gates Part F)  review)    counter-sign  paper-first)
                                                                            for capital)
```

## Definition of Ready (DoR) — before you start (IMP-23)

- [ ] A ratified **contract** (schema/interface) exists in `contracts/`.
- [ ] An **architectural home** (Architecture V2 layer) is identified; ADR + Patch ID if architecture changes.
- [ ] **Governing documents** identified (Rulebook / Registry / Contract / framework).
- [ ] **Acceptance criteria** written; dependencies available and their guarantees enforced.

## Building the module

1. **Place it correctly.** Use the [Directory Map](DIRECTORY_MAP.md) and [Architecture Map](ARCHITECTURE_MAP.md). One responsibility per module (SE-1); no asset-class branching in core (CP-8).
2. **Depend inward, via contracts only.** Consume other components through their contracts, never their internals (SE-2, AV2-13). No circular dependencies (IMP-12).
3. **Inject non-determinism.** Time, randomness, and model calls are injected, never accessed ambiently (CS-3, PIT-4). All historical reads carry an explicit `as_of` (PIT-1).
4. **Deterministic decisions are deterministic engines.** Any consequential decision (significance, validation, risk, allocation, promotion, execution) is a versioned, golden-tested engine (DE-1..4). No LLM in the path (AI-1..4).
5. **Record provenance & manifests.** Every deterministic artifact carries a Run Manifest and is reproducible (RP-1); every AI output records model/prompt/output hashes (AI-8).
6. **Write the tests with the code.** Golden-set tests for decision engines are mandatory and are a **hard gate** (CS-2, VS-1, IMP-26).

## Definition of Done (DoD) — before you merge (IMP-24)

All gates green (Roadmap Part E), reproducible and auditable, and — for capital-adjacent modules —
the module's Patch-Plan patches green and the applicable **release gate** satisfied.

## The governance gates (a change cannot merge without passing — Roadmap Part E/F)

| Gate                    | You must show                                                            | Owner |
| ----------------------- | ------------------------------------------------------------------------ | ----- |
| Architecture compliance | conforms to Architecture V2; invariants intact; ADR/Patch traced         | ARB   |
| Engineering review      | SRP, coupling, dependency direction (RB-20, RB-22)                       | PE    |
| Testing                 | required tests incl. **golden-set** for engines (RB-21)                  | PE    |
| Documentation           | governing docs cited; **all references resolve** (RB-23, DOC-4)          | PE    |
| Security                | secret-scan clean; deps scanned; **no secrets in repo** (RB-27, CODE-29) | CISO  |
| AI review               | if AI-touched: AIGOV limits, provenance, isolation (RB-15)               | HAI   |
| Human approval          | critical/capital-affecting changes approved + counter-signed             | GRC   |
| Reproducibility         | reproducible from manifest (RB-05, P1-02)                                | PE    |

The **Deterministic, Statistical, and Reproducibility** gates are **hard** for any
research/engine/capital-adjacent deliverable — no other score compensates (IMP-26). A failed or
skipped required gate blocks merge and is fail-closed (IMP-E-1, CR-4).

## Git & change hygiene (RB-24 · GIT)

- Work on a branch; merge via reviewed PR. **Never commit directly to the default branch** (GIT-1).
- One atomic logical change per commit (GIT-2). Architecture-affecting changes reference their Patch ID and ADR (GIT-3).
- History is part of the audit trail; do not rewrite it after merge (GIT-4). Never commit secrets or raw vendor data (GIT-5).
- This repository is **not yet a git repository**; run `git init` and create the initial branch before the first commit.

## Recording decisions (ADR — RB-25)

Every non-obvious decision affecting correctness, architecture, or research validity is an ADR in
[`docs/adr/`](../adr/) (DOC-2). Start from [`0000-template.md`](../adr/0000-template.md). ADRs are
immutable once accepted; any deviation from the Patch Plan or Roadmap is an ADR citing the affected
Patch/Phase IDs (ADR-3, IMP-W-3).

## Regenerating the skeleton

Structural changes to the repository foundation are made in
[`tools/scaffolding/generate_foundation.sh`](../../tools/scaffolding/generate_foundation.sh) and
re-run (it is idempotent) — never drifted by hand. The generator is technology-independent and
creates no business logic.
