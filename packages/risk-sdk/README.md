# @platform/risk-sdk (Phase 6.10)

The shared **Risk Engine** SDK — the single source of truth for the engine
_vocabulary_ spoken by the `risk-engine-service`, the researcher UI in
`apps/research-web/src/modules/risk-engine` and the administrator UI in
`apps/admin-web/src/modules/risk-engine`.

## Risk lifecycle

```
Draft → Risk Assessment Requested → Policy Validation → Exposure Review →
Limit Validation → Exception Review → Approval → Execution Authorized → Archived
```

Gates: **Policy Validation · Limit Validation · Approval**. Also supports
revalidation, policy changes, exception handling and risk overrides.

## What it is (and is not)

- **Is:** the lifecycle stages, status vocabularies, engine capabilities, a metric
  **catalog** (descriptors only) and the canonical models (`RiskAssessment`,
  `RiskPolicy`, `RiskRule`, `RiskLimit`, `RiskConstraint`, `RiskExposure`,
  `RiskApproval`, `RiskException`, `RiskOverride`, `RiskReport`, `RiskAudit`,
  `RiskSnapshot`, `RiskReview`, `RiskLineage`, …) plus pure identifier/version helpers.
- **Is not:** a risk model. It contains **NO** VaR, **NO** CVaR, **NO** expected
  shortfall, **NO** stress testing, **NO** exposure calculation, and **no** persistence,
  cache, database or transport. Portfolios, backtests, signals and strategies are
  referenced by **ref** only; exposure values, limit bounds and metric values are inert
  supplied strings.
