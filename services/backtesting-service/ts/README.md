# backtesting-service · TypeScript orchestration layer (Phase 6.8)

This `ts/` package is the **Backtesting Engine v1** orchestration layer, added
**alongside** the pre-existing Python placeholder under `src/backtesting_service/`
(which is left untouched). It is the canonical orchestration platform for
quantitative strategy evaluation consumed by the researcher-facing UI in
`apps/research-web/src/modules/backtesting`, speaking the shared vocabulary from
`@platform/backtesting-sdk`.

## Backtest lifecycle

```
Draft → Configuration → Validation → Queued → Running → Completed → Review → Approved → Archived
```

Run controls: **cancel · retry · pause · resume**, structurally gated by run state.

## What it is (and is not)

- **Is:** an orchestration + registry service over the backtesting lifecycle,
  exposing the engine capabilities (historical simulations, walk-forward, rolling
  windows, parameter sets, scenario management, result comparison, metric catalog,
  experiment/signal/feature/dataset/portfolio linking) through a pure domain layer
  and an application layer.
- **Is not:** a compute or storage layer. It implements **no** simulation engine,
  **no** performance-metric computation, **no** optimization, and holds **no**
  persistence/cache/database. Simulations run in the external Simulation Runner
  (behind a port); metric VALUES are supplied as inert data and only reshaped for
  comparison — never calculated. Validation verdicts and approvals are decided
  elsewhere (CP-5); the engine reflects and reroutes them.

## Layering

```
ts/application (BacktestingService)
  → ts/domain (discovery/search + lifecycle/run-controls + derivations/comparison)
  → ts/infrastructure ports (Backtest/Family/Comparison query · MarketData ·
    SimulationRunner · Validation · Workflow · EventBus · Configuration)
```

Only **interfaces** touch infrastructure; concrete adapters are bound in
`ts/composition.ts`. In v1 the only adapters are in-memory mocks — swapping in real
adapters requires no application/domain change.
