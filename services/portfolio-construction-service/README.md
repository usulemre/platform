# portfolio-construction-service (Phase 6.9)

The canonical **Portfolio Construction Engine** — the orchestration platform that
transforms approved trading signals into governed investment portfolios. Consumed by
the researcher-facing UI in `apps/research-web/src/modules/portfolio-construction`,
speaking the shared vocabulary from `@platform/portfolio-sdk`.

## Portfolio lifecycle

```
Draft → Signal Selection → Constraint Definition → Allocation Configuration →
Optimization Request → Validation → Review → Approval → Published → Archived
```

Gates: **Validation · Review · Approval**. Optimization-request controls: **cancel ·
retry**, structurally gated by request state. Also supports revision, versioning and
rebalancing requests.

## What it is (and is not)

- **Is:** an orchestration + registry service over the portfolio-construction
  lifecycle, exposing the engine capabilities (portfolio templates, constraints,
  allocation models, optimization requests, signal selection, universe management,
  versioning, review, approval, registry, comparison, metadata, lineage, snapshots)
  through a pure domain layer and an application layer.
- **Is not:** a compute or storage layer. It implements **no** optimizer, **no**
  mean-variance / Black-Litterman / risk-parity algorithm, **no** weight calculation,
  **no** risk computation, and holds **no** persistence/cache/database. Optimization
  runs in the external Optimizer (behind a port); target weights, constraint bounds
  and metric VALUES are supplied as inert data and only reshaped for comparison —
  never calculated. Validation verdicts, risk assessments and approvals are decided
  elsewhere (CP-5); the engine reflects and reroutes them.

## Layering

```
src/application (PortfolioConstructionService)
  → src/domain (discovery/search + lifecycle/optimization-controls + derivations/comparison)
  → src/infrastructure ports (Portfolio/Family/Comparison/Template query · MarketData ·
    Optimizer · Risk · Validation · Workflow · EventBus · Configuration)
```

Only **interfaces** touch infrastructure; concrete adapters are bound in
`src/composition.ts`. In v1 the only adapters are in-memory mocks — swapping in real
adapters requires no application/domain change.
