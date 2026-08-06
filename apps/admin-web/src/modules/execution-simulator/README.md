# execution-simulator module (admin-web · Phase 6.11)

The administrator-facing UI for the **Execution Simulator**. A fully layered module that
renders the sessions registry, session details, simulation review + approval queues,
scenario templates and simulation comparisons — reading through the shared vocabulary in
`@platform/execution-sdk`.

It shares the same layered stack as the research-web execution-simulator module (domain /
data / application / hooks / components) but is a **self-contained copy**: the admin
mappers do not deep-link into research-web modules (dependency/lineage cross-links render
as plain labels).

## What it is (and is not)

- **Is:** presentation + administration surfaces. All labels, tones, tables and timelines
  are derived by pure mappers so components stay logic-free.
- **Is not:** a trading system. It never contacts an exchange or broker, never speaks FIX
  or WebSocket, runs **no** execution algorithm and computes **no** fill/price/PnL. Order
  states, quantities, prices, exposures and metric values are inert supplied data;
  simulations run in the simulator and verdicts/approvals are decided elsewhere —
  reflected here, never decided here.

## Routes

`/execution-simulator` (dashboard + registry) · `/[sessionId]` (session details) ·
`/review` (review + approval queues) · `/templates` (scenario templates) ·
`/comparisons` (+ `/[comparisonId]`).
