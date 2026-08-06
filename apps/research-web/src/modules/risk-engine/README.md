# risk-engine module (research-web · Phase 6.10)

The researcher-facing UI for the **Risk Engine**. A fully layered module that renders the
risk-governance lifecycle, registry, review/validation/approval/exception queues, portfolio
risk details (policies, rule explorer, limits, exposures, exceptions, overrides, reviews,
approval, reports, audit timeline, lineage, metadata), exposure summary and reports —
reading through the shared vocabulary in `@platform/risk-sdk`.

## Layering

```
components (Client Components)
  → hooks (TanStack Query + Zustand list controls)
  → application (RiskEngineAdminService: DTO → view-model)
  → data (repository interface · Mock adapter + seed · Api adapter)
  → domain (dto · query · view-model · mappers)
```

The app depends on this module only through the container components exported from
`index.ts`. In v1 the composition root binds the **Mock** repository (its own synthetic
seed); swap in `ApiRiskEngineRepository` (over the risk-engine service gateway) to go live —
no component/hook/service change.

## What it is (and is not)

- **Is:** presentation. All labels, tones, stage steps, progress, limit/exposure tables,
  control availability and comparison tables are derived by pure mappers so components stay
  logic-free.
- **Is not:** a risk model. It runs **no** VaR, **no** CVaR, **no** stress testing, computes
  **no** exposures, holds **no** business logic and **no** persistence. Exposure values,
  limit bounds and indicator values are inert supplied data; exposures come from the risk
  model and verdicts/approvals are decided elsewhere — reflected here, never decided here.

## Routes

`/risk-engine` (dashboard + registry) · `/[assessmentId]` (portfolio risk details) ·
`/review` (validation/review/approval/exception queues) · `/exposures` · `/reports`.
