/**
 * @platform/portfolio-optimization-sdk — the shared, production Portfolio Optimization library.
 *
 * REAL, deterministic, reproducible construction of optimal portfolios from expected returns, a
 * covariance matrix and trading signals, subject to real constraints. Implements the actual
 * numerical algorithms — dense linear algebra (ridge-regularized Cholesky solves), sample
 * return/covariance estimation, an Objective Function Engine, a Constraint Engine (feasible-set
 * projection + evaluation), twelve optimizers (equal weight, inverse volatility, minimum variance,
 * mean-variance/Markowitz, maximum Sharpe, maximum diversification, risk parity / equal-risk-
 * contribution, target volatility, position sizing, rebalancing, cash allocation) and an efficient-
 * frontier explorer.
 *
 * Every optimizer is deterministic and reproducible (RP-1): the same input always yields the same
 * weights — no randomness, no ambient state, no wall-clock reads. Numerical edge cases (singular
 * covariance, zero volatility, degenerate universes) are handled by the regularized solves and
 * bounded projections.
 *
 * This engine COMPUTES portfolio weights; the decision to deploy capital, the risk sign-off and the
 * execution remain the exclusive domain of the downstream deterministic risk, governance and
 * execution engines that consume these allocations.
 */
export * from './linalg';
export * from './types';
export * from './statistics';
export * from './objectives';
export * from './constraints';
export * from './optimizers';
export * from './frontier';
export * from './signals';
export * from './catalog';
