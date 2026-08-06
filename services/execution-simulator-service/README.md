# execution-simulator-service (Phase 6.11)

The canonical **Execution Simulator** — the paper-trading and execution-simulation
platform that validates execution workflows before any strategy is promoted to live
trading. Consumed by the researcher UI in
`apps/research-web/src/modules/execution-simulator` and the administrator UI in
`apps/admin-web/src/modules/execution-simulator`, speaking the shared vocabulary from
`@platform/execution-sdk`.

## Simulation lifecycle

```
Draft → Scenario Configuration → Validation → Queued → Running → Completed →
Review → Approved → Archived
```

Gates: **Validation · Review · Approved**. Run controls: **pause · resume · retry ·
cancel · replay**, structurally gated by run state.

## What it is (and is not)

- **Is:** an orchestration + registry service over the simulation lifecycle, exposing the
  engine capabilities (paper trading, order/position/portfolio simulation, replay,
  timeline, reports, comparison, metadata, history, validation, scenario templates)
  through a pure domain layer and an application layer.
- **Is not:** a trading system. It NEVER communicates with an exchange or broker, NEVER
  implements FIX or WebSocket, implements **no** execution algorithm and **no**
  fill/price/PnL computation, and holds **no** persistence/cache/database. Simulations run
  in the external Simulation Runner (behind a port); quantities, prices, exposures and
  metric VALUES are supplied as inert data and only reshaped for comparison — never
  calculated. Validation verdicts and approvals are decided elsewhere (CP-5); the engine
  reflects and reroutes them, recording every governed action to the Audit Center.

## Layering

```
src/application (ExecutionSimulatorService)
  → src/domain (discovery/search + lifecycle/run-controls + derivations/comparison)
  → src/infrastructure ports (Session/Family/Comparison/Template query · MarketData ·
    Simulator · Validation · Workflow · EventBus · Audit · Notification · Configuration)
```

Only **interfaces** touch infrastructure; concrete adapters are bound in
`src/composition.ts`. In v1 the only adapters are in-memory mocks — swapping in real
adapters requires no application/domain change.
