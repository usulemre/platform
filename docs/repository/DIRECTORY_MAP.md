# Directory Map

> The authoritative index of every directory in the monorepo: its responsibility, owner, and
> governing documents. Each directory also carries its own `README.md` with the full
> Purpose / Scope / Responsibilities / Allowed / Forbidden / Ownership / Dependencies / Governance
> block. This map is the one-screen overview.

- **Owner:** ARB. **Governed by:** [Architecture V2](../architecture/architecture_v2.md) §2, RB-26 · NAME.

## Naming & organization rules (RO-_, NM-_)

- Names reflect a **single responsibility** and the domain vocabulary in [`shared/`](../../shared/) (NM-1, KM-3).
- Artifact identifiers are **content-addressed or versioned** — one name denotes one immutable version (NM-2).
- New code matches the naming and idiom of its surrounding module (NM-3); asset-class names never appear in core (NM-4, CP-8).
- New top-level concepts map to an existing Architecture V2 layer or are introduced via a Patch (RO-1).

## Top-level directories

| Directory         | Responsibility (one line)                                           | Owner       | Governance                          |
| ----------------- | ------------------------------------------------------------------- | ----------- | ----------------------------------- |
| `apps/`           | Human consoles; act only via governed APIs, never decide            | PE          | AV2 §5.9, §6.2; RB-23               |
| `services/`       | One backend service per bounded context / Architecture V2 component | per service | AV2 §5; the six Registries          |
| `packages/`       | Shared, versioned libraries & SDKs; consumers depend on contracts   | PE/HSRE     | AV2 §5.10; RB-20                    |
| `agents/`         | Registered, contract-bound AI agents (propose/narrate only)         | HAI         | AV2 §5.3; RB-15; Agent Registry     |
| `contracts/`      | The contract registry (agent_io/workflows/services/api/domain)      | ARB         | AV2 §5.10; Agent/Workflow Contracts |
| `workflows/`      | Tier-5 workflow definitions; orchestrate, never adjudicate          | HSRE        | AV2 §5.4; Workflow Contracts        |
| `datasets/`       | Certified, PIT, provenance-bearing dataset artifacts                | HD          | AV2 §5.8; Dataset Governance        |
| `experiments/`    | Registered experiment manifests; Trial-Ledger-linked                | HR/HQ       | AV2 §5.5; Experiment Tracking       |
| `features/`       | PIT-bound, leakage-clean feature definitions                        | HD/HQ       | AV2 §5.5/5.8; Feature Registry      |
| `signals/`        | Signal generation lifecycle artifacts                               | HQ          | AV2 §5.5; Signal Registry           |
| `strategies/`     | Strategy lifecycle artifacts (with defined retirement)              | HQ/HPR      | AV2 §5.5; Strategy Registry         |
| `portfolios/`     | Immutable, rationale-bearing portfolio snapshots                    | HPR         | AV2 §5.6; Portfolio Registry        |
| `shared/`         | Shared kernel: ontologies, vocabulary, enums                        | ARB/PE      | KM-3; NM-1..4                       |
| `scripts/`        | Auditable developer & operational scripts                           | PE          | GIT-1..5; SEC-3                     |
| `configs/`        | Configuration + environment separation; secrets by reference        | PE/HSRE     | SEC-3; CODE-29                      |
| `tests/`          | Golden, conformance, integration, e2e suites                        | PE          | RB-21; AV2 §12                      |
| `infrastructure/` | Vendor-neutral substrate (bus+ACLs, stores, identity)               | HSRE        | AV2 §5.10, §10                      |
| `deployment/`     | Paper-first, token-gated release & rollback                         | HSRE/HPR    | AV2 §5.9; RB-30                     |
| `tools/`          | Build-time & governance tooling (incl. the scaffolder)              | PE          | RB-20..27                           |
| `examples/`       | Reference, non-production governed-pattern examples                 | PE          | IMP-1, IMP-10                       |
| `docs/`           | The governance corpus (Tiers 1–5) + this repository index           | ARB         | CLAUDE.md; DOC-1..4                 |

## Second-level structure (selected)

```
services/            research · dataset · feature · signal · strategy · portfolio ·
                     backtesting · validation · risk · execution · monitoring
packages/            core-domain · shared-types · contracts · utilities · configuration ·
                     logging · observability · security · validation · workflow-engine ·
                     ai-runtime · research-sdk · data-sdk
agents/              research-discovery · feature-discovery · analysis · validation-narrator ·
                     risk-narrator · portfolio-narrator · documentation · engineering ·
                     monitoring-narrator   (each with AGT-<CAT>-<nnn> sub-dirs)
contracts/           agent_io · workflows · services · api · domain
workflows/           research-discovery · feature-research · backtesting · validation ·
                     risk-review · portfolio-construction · production-deployment
apps/                research-web · admin-web · monitoring-web · docs
shared/              ontologies · vocabulary · enums
configs/             environments/{development,staging,production} · schema
tests/               unit · integration · golden · conformance · e2e
infrastructure/      bus · artifact-store · identity · temporal-store
deployment/          release · rollback · environment-promotion
tools/               scaffolding · ci
docs/                architecture · adr · rulebooks · contracts · registry · research ·
                     operations · evaluation · data · standards · implementation · repository
```

## Placeholders & markers

- Every directory contains a `README.md` and a `.gitkeep`.
- `services/*` carry a `service.contract.placeholder.md`; `packages/*` a `package.placeholder.md`;
  `workflows/*` a `workflow.contract.placeholder.md` — signalling **contract-first** construction (IMP-10).
- Registry-governed artifact directories carry a `_registry/` placeholder.

## Regeneration

The structure is generated by [`tools/scaffolding/generate_foundation.sh`](../../tools/scaffolding/generate_foundation.sh)
— an idempotent, auditable artifact (IMP-7, IMP-17). Structural changes are made there and
re-run, never drifted by hand.
