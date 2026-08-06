# @platform/execution-sdk (Phase 6.11)

The shared **Execution Simulator** SDK — the single source of truth for the simulator
_vocabulary_ spoken by the `execution-simulator-service`, the researcher UI in
`apps/research-web/src/modules/execution-simulator` and the administrator UI in
`apps/admin-web/src/modules/execution-simulator`.

## Simulation lifecycle

```
Draft → Scenario Configuration → Validation → Queued → Running → Completed →
Review → Approved → Archived
```

Gates: **Validation · Review · Approved**. Run controls: **pause · resume · retry ·
cancel · replay**, structurally gated by run state.

## Order states

```
Created → Validated → Queued → Submitted → Partially Filled → Filled
                                         ↘ Cancelled / Rejected / Expired
```

## What it is (and is not)

- **Is:** the lifecycle stages, run/order status vocabularies, engine capabilities, a
  metric **catalog** (descriptors only) and the canonical models (`SimulationSession`,
  `SimulationScenario`, `ExecutionOrder`, `ExecutionFill`, `ExecutionPosition`,
  `ExecutionPortfolio`, `ExecutionReplay`, `ExecutionReport`, `ExecutionSnapshot`,
  `ScenarioTemplate`, …) plus pure identifier/version helpers.
- **Is not:** a trading system. It contains **NO** execution algorithm, **NO** exchange
  connectivity, **NO** broker SDK, **NO** FIX, **NO** WebSocket, **NO** fill/price/PnL
  computation, and **no** persistence, cache, database or transport. Portfolios,
  strategies and backtests are referenced by **ref** only; quantities, prices, exposures
  and metric values are inert supplied strings.
