# @platform/portfolio-sdk (Phase 6.9)

The shared **Portfolio Construction Engine** SDK — the single source of truth for
the engine _vocabulary_ spoken by both the `portfolio-construction-service` and the
researcher-facing UI in `apps/research-web/src/modules/portfolio-construction`.

## Portfolio lifecycle

```
Draft → Signal Selection → Constraint Definition → Allocation Configuration →
Optimization Request → Validation → Review → Approval → Published → Archived
```

Gates: **Validation · Review · Approval**. Also supports revision, versioning and
rebalancing requests. Optimization-request controls: **cancel · retry**, structurally
gated by request state.

## What it is (and is not)

- **Is:** the lifecycle stages, status vocabularies, engine capabilities, a metric
  **catalog** (descriptors only), the canonical models (`Portfolio` /
  `PortfolioDefinition`, `PortfolioAllocation`, `PortfolioConstraint`,
  `PortfolioOptimizationRequest`, `PortfolioUniverse`, `PortfolioTemplate`,
  `PortfolioVersion`, `PortfolioSnapshot`, `PortfolioReview`, `PortfolioApproval`,
  `PortfolioLineage`, `PortfolioDependency`, …) and pure identifier/version helpers.
- **Is not:** an optimizer. It contains **no** mean-variance, Black-Litterman or
  risk-parity algorithm, **no** weight calculation, **no** risk computation, **no**
  statistics, and **no** persistence, cache, database or transport. Signals,
  strategies, features, datasets and backtests are referenced by **ref** only; target
  weights, constraint bounds and metric values are inert supplied strings.
