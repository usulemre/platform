# portfolio-optimization module (research-web · Phase 7.5)

The researcher-facing UI for the **Portfolio Optimization Engine**. Like the feature/signal
calculation modules, its data layer runs the **real** optimization library
(`@platform/portfolio-optimization-sdk`) over deterministic synthetic universes to produce genuine,
live allocations — no optimization is mocked.

## Pages

- **Optimization Dashboard** — headline counts, category distribution, optimizer dependency graph.
- **Constraint Editor** — configure the constraints (long-only/short, min/max weight, leverage, cash
  reserve, turnover, sector caps) applied to every optimizer; shared across the surface.
- **Allocation Explorer** — pick any of the 12 real methods, a universe and parameters, and optimize
  live; see the weights, risk contributions, metrics and the feasibility + determinism + objective
  validation.
- **Efficient Frontier** — the mean-variance frontier (risk/return scatter) with the max-Sharpe point.
- **Portfolio Comparison** — compare several methods' metrics over the same universe and constraints.
- **Optimization History** — execution history, aggregate performance and the optimizer benchmark.

## Layering

```
components (Client Components) + a Zustand constraint store (shared across pages)
  → hooks (TanStack Query + mutations for optimize/frontier/compare)
  → application (PortfolioOptimizationAdminService: result → view-model)
  → data (repository interface · Mock adapter running the real SDK · synthetic universes · runner)
  → @platform/portfolio-optimization-sdk (the real optimization algorithms)
```

## What it is (and is not)

- **Is:** presentation of real computation. Formatting only in the mappers; the optimization,
  estimation and validation run in the SDK / data layer.
- **Is not:** it holds no optimization algorithms of its own and no persistence; the mock repository
  computes with the real SDK against seeded synthetic universes (mock DATA, never mock optimization).
  It shows portfolio weights only — no capital deployment, risk sign-off or execution.

## Routes

`/portfolio-optimization` (dashboard) · `/constraints` · `/allocation` · `/frontier` · `/comparison`
· `/history`.
