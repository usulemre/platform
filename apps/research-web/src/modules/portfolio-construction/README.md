# portfolio-construction module (research-web · Phase 6.9)

The researcher-facing UI for the **Portfolio Construction Engine**. A fully layered
module that renders the portfolio-construction lifecycle, registry, builder, details,
versions, allocation explorer, constraints, optimization requests, reviews, approval
queue, metadata, dependencies, lineage and comparison — reading through the shared
vocabulary in `@platform/portfolio-sdk`.

## Layering

```
components (Client Components)
  → hooks (TanStack Query + Zustand list controls)
  → application (PortfolioConstructionAdminService: DTO → view-model)
  → data (repository interface · Mock adapter · Api adapter)
  → domain (dto · query · view-model · mappers)
```

The app depends on this module only through the container components exported from
`index.ts`. In v1 the composition root binds the **Mock** repository (its own synthetic
seed); swap in `ApiPortfolioConstructionRepository` (over the portfolio-construction
service gateway) to go live — no component/hook/service change.

## What it is (and is not)

- **Is:** presentation. All labels, tones, stage steps, progress, allocation tables,
  optimization-control availability and comparison tables are derived by pure mappers so
  components stay logic-free.
- **Is not:** an optimizer or a calculator. It runs **no** optimization, calculates
  **no** weights, computes **no** risk, holds **no** business logic and **no**
  persistence. Target weights, constraint bounds and characteristic values are inert
  supplied data; optimization runs in the external optimizer and verdicts/approvals are
  decided elsewhere — reflected here, never decided here.

## Routes

`/portfolio-construction` (dashboard + registry) · `/builder` · `/[portfolioId]` ·
`/optimization` (optimization requests + queues) · `/comparisons` (+ `/[comparisonId]`) ·
`/families`.
