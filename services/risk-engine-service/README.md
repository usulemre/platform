# risk-engine-service (Phase 6.10)

The canonical **Risk Engine** — the governance and orchestration platform that
validates portfolios before execution. Consumed by the researcher UI in
`apps/research-web/src/modules/risk-engine` and the administrator UI in
`apps/admin-web/src/modules/risk-engine`, speaking the shared vocabulary from
`@platform/risk-sdk`.

## Risk lifecycle

```
Draft → Risk Assessment Requested → Policy Validation → Exposure Review →
Limit Validation → Exception Review → Approval → Execution Authorized → Archived
```

Gates: **Policy Validation · Limit Validation · Approval**. Governance controls:
**revalidate · raise-exception · record-override**, structurally gated by assessment
state. Also supports policy changes and exception handling.

## What it is (and is not)

- **Is:** a governance + orchestration + registry service over the risk lifecycle,
  exposing the engine capabilities (portfolio/policy/exposure/limit validation, approval
  workflow, registry, history, reports, audit, exceptions, overrides, lineage) through a
  pure domain layer and an application layer.
- **Is not:** a risk model. It implements **NO** VaR, **NO** CVaR, **NO** expected
  shortfall, **NO** stress testing, **NO** exposure calculation, and holds **no**
  persistence/cache/database. Exposures and indicators are produced by the external Risk
  Model (behind a port); exposure values, limit bounds and metric VALUES are supplied as
  inert data and only reshaped for comparison — never calculated. Policy/limit
  validation verdicts and approvals are decided elsewhere (CP-5); the engine reflects
  and reroutes them, and records every governance event to the Audit Center.

## Layering

```
src/application (RiskEngineService)
  → src/domain (discovery/search + lifecycle/governance-controls + derivations/comparison)
  → src/infrastructure ports (Assessment/Family/Comparison/Policy query · Portfolio ·
    RiskModel · Validation · Workflow · EventBus · Audit · Notification · Configuration)
```

Only **interfaces** touch infrastructure; concrete adapters are bound in
`src/composition.ts`. In v1 the only adapters are in-memory mocks — swapping in real
adapters requires no application/domain change.
