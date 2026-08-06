# portfolio-optimization-service (Phase 7.5)

The canonical **Portfolio Optimization Engine** — the production computation engine that constructs
optimal portfolios from approved trading signals and estimated risk. **This service performs REAL
optimization** (via `@platform/portfolio-optimization-sdk`); it is not an orchestration/abstraction
layer.

## What it does

- **Optimizer executors** — bind each catalog method to its real SDK algorithm (equal weight,
  inverse volatility, minimum variance, mean-variance, maximum Sharpe, maximum diversification, risk
  parity / equal-risk-contribution, target volatility, position sizing, rebalancing, cash allocation).
- **Input estimation** — build the optimization input from a universe's returns matrix (real sample
  mean, covariance, volatilities and momentum signals).
- **Execution pipeline** — estimate → optimize → metrics → **validation** → **cache** / **result
  registry**, ordered by the **dependency graph** scheduler.
- **Constraint & Objective engines** — (in the SDK) the feasible-set projection and the objective
  functions the optimizers use.
- **Validation pipeline** — real checks: finiteness, **constraint feasibility** (box, budget,
  leverage, long-only, asset/sector exposure, turnover), **determinism** (byte-identical recompute)
  and a method-appropriate **objective** check (min-variance really minimizes variance, risk parity
  really equalizes risk contributions, …).
- **Efficient frontier**, **optimizer comparison**, **metadata generator**, **benchmark runner** and
  **registry integration**.

## Guarantees

- **Deterministic & reproducible (RP-1)** — no randomness, no wall-clock in optimization; injected
  timer/clock/id keep the pipeline reproducible.
- **Scope** — computes portfolio weights only; it does not deploy capital, sign off risk or execute.
- **Modular & testable** — pure domain, ports for all IO, in-memory adapters in v1. Synthetic
  universes are seeded PRNG factor-model returns (mock DATA, never mock optimization).

## Layering

```
src/application (PortfolioOptimizationService)
  → src/domain (input · executors · dependency-graph · pipeline · validation · metadata · benchmark · hashing)
  → @platform/portfolio-optimization-sdk (the real optimization algorithms)
  → src/infrastructure ports (MarketData/universes · OptimizationStore · Cache · ResultStore · Workflow · Configuration)
```

`pnpm --filter @services/portfolio-optimization-service test` runs the engine tests;
`… bench` runs the benchmark suite.
