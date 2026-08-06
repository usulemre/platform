# @platform/portfolio-optimization-sdk (Phase 7.5)

The shared, **production** Portfolio Optimization library — real, deterministic, reproducible
construction of optimal portfolios from expected returns, a covariance matrix and trading signals,
subject to real constraints. Genuine computation code (not an abstraction): it implements the actual
numerical algorithms.

## Optimizers

- **Naive:** equal weight
- **Risk-based:** inverse volatility, minimum variance, maximum diversification, risk parity /
  equal-risk-contribution
- **Return-based:** mean-variance (Markowitz), maximum Sharpe
- **Allocation:** target volatility, position sizing, portfolio rebalancing, cash allocation

## Engines

- **Linear algebra** (`linalg.ts`) — dense matrices, matrix-vector products, quadratic forms, a
  ridge-regularized Cholesky decomposition, SPD solve/inverse and a power-iteration eigenvalue.
- **Statistics** (`statistics.ts`) — sample mean returns, covariance, volatilities, correlation.
- **Objective Function Engine** (`objectives.ts`) — return, variance/volatility, Sharpe,
  diversification ratio, risk contributions, concentration, mean-variance utility.
- **Constraint Engine** (`constraints.ts`) — feasible-set projection (box, budget/cash, gross
  leverage, sector caps, liquidity) and constraint evaluation for validation/reports.
- **Efficient Frontier** (`frontier.ts`) — the mean-variance frontier and its max-Sharpe point.

## Constraints

Maximum/minimum position weight, maximum per-asset exposure, maximum sector exposure, maximum
turnover, maximum (gross) leverage, cash reserve, liquidity caps, long-only and long/short.

## Guarantees

- **Deterministic & reproducible (RP-1).** The same input always yields the same weights — no
  randomness, no ambient state, no wall-clock reads.
- **Numerically robust.** Singular/near-singular covariance is ridge-regularized; zero volatilities
  and degenerate universes are handled; projections are bounded and convergent.
- **Real algorithms.** Projected-gradient QP (min-variance, mean-variance), closed-form solves
  (min-variance seed, max diversification), a convergent risk-parity fixed point, a frontier scan
  for maximum Sharpe, and turnover-limited rebalancing.

## Scope

This engine **computes portfolio weights**; the decision to deploy capital, the risk sign-off and
the execution remain the exclusive domain of the downstream deterministic risk, governance and
execution engines that consume these allocations.

## Testing

`pnpm --filter @platform/portfolio-optimization-sdk test` runs the unit suite (hand-checked weights,
constraint projection, frontier, determinism). `… bench` runs the micro-benchmarks.
