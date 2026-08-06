# execution-simulator module (research-web · Phase 6.11)

The researcher-facing UI for the **Execution Simulator**. A fully layered module that
renders the simulation lifecycle, sessions registry, session details (scenario, order /
fill / position explorers, order timeline, portfolio state, execution metrics, replay,
validation, reports, artifacts, reviews, approval, lineage, versions, snapshots),
execution/review/approval queues, simulation history and execution reports — reading
through the shared vocabulary in `@platform/execution-sdk`.

## Layering

```
components (Client Components)
  → hooks (TanStack Query + Zustand list controls)
  → application (ExecutionSimulatorAdminService: DTO → view-model)
  → data (repository interface · Mock adapter + seed · Api adapter)
  → domain (dto · query · view-model · mappers)
```

The app depends on this module only through the container components exported from
`index.ts`. In v1 the composition root binds the **Mock** repository (its own synthetic
seed); swap in `ApiExecutionSimulatorRepository` (over the execution-simulator service
gateway) to go live — no component/hook/service change.

## What it is (and is not)

- **Is:** presentation. All labels, tones, stage steps, progress, order/fill/position
  tables, run-control availability and comparison tables are derived by pure mappers so
  components stay logic-free.
- **Is not:** a trading system. It never contacts an exchange or broker, never speaks FIX
  or WebSocket, runs **no** execution algorithm and computes **no** fill/price/PnL. Order
  states, quantities, prices, exposures and metric values are inert supplied data;
  simulations run in the simulator and verdicts/approvals are decided elsewhere —
  reflected here, never decided here.

## Routes

`/execution-simulator` (dashboard + sessions) · `/[sessionId]` (session details) ·
`/queue` (execution/review/approval queues) · `/history` · `/reports`.
