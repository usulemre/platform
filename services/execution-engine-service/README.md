# execution-engine-service (Phase 7.7)

The canonical **Execution Engine** — the execution orchestration engine that receives approved orders
from the OMS and determines how they should be executed according to execution policies. **This
service implements REAL, deterministic execution-workflow logic** (via the
`@platform/execution-engine-sdk` state machine + a policy framework); it is broker-independent.

## What it does

- **Execution Planner** — build a deterministic `ExecutionPlan` (+ child `ExecutionTask` slices) from
  a request and its policies (venue selection, scheduling strategy, slicing, priority, retry/timeout).
- **Policy framework** — REAL, deterministic policy evaluators for the 10 policy types (immediate,
  scheduled, time-window, partial, retry, timeout, priority, throttling, venue-selection,
  risk-validation), each returning a `PolicyEvaluation`; the gate blocks on risk / out-of-window.
- **Lifecycle application** — state-machine-enforced transitions (`order received → execution planned
→ execution validated → waiting for venue → executing → partially executed → completed / cancelled
/ failed`) with an appended event, state-history entry and audit record on every step.
- **Executors** — advance the lifecycle and execute the plan's slices (price supplied by the venue
  abstraction), with slice bookkeeping (executed/remaining quantity, average execution price).
- **Actions** — retry / pause / resume / cancel / replay, gated by `permittedActions`.
- **Sessions** — govern batches/runs of executions. **Search / metrics / health / replay** —
  deterministic aggregation and event-sourced reconstruction validated against the state machine.

## What it is NOT

Broker-independent: no broker SDK, no exchange API, no FIX, no REST/WebSocket transport, no order
execution, no persistence beyond in-memory v1 adapters. Routing to a venue is an abstraction
dispatched through the Execution Venue port; the actual venue lives downstream (Execution Simulator /
Live Trading Platform).

## Layering

```
src/application (ExecutionEngineService)
  → src/domain (planner · policy-evaluators · validation · lifecycle · executors · sessions · search · metrics · health · replay)
  → @platform/execution-engine-sdk (the state machine + policy vocabulary + models)
  → src/infrastructure ports (ExecutionStore · SessionStore · ExecutionVenue · OMS · Risk · Workflow · Audit · Notification · EventBus · Configuration)
```

`pnpm --filter @services/execution-engine-service test` runs the unit + integration suite.
