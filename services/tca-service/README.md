# tca-service

The canonical **Transaction Cost Analysis (TCA) Engine** — the execution-quality analytics platform
that evaluates executed trades against market benchmarks and execution objectives.

It implements **real, deterministic** post-trade cost analytics via
[`@platform/tca-sdk`](../../packages/tca-sdk): per-execution analytics, eight-benchmark comparison
(arrival, decision, VWAP, TWAP, close, open, mid, last), effective/realized spread, the
permanent/temporary market-impact decomposition, Perold implementation shortfall, the additive cost
breakdown and attribution, execution efficiency and a 0–100 quality score, plus notional-weighted
per-venue comparison, cost reports, execution scorecards and service-level metrics.

## Layers

- `domain/` — pure, deterministic roll-ups: `reports`, `scorecards`, `metrics`, `search`.
- `application/tca-service.ts` — the orchestration surface (the only layer callers use).
- `infrastructure/ports.ts` — the injected boundaries to upstream subsystems.
- `infrastructure/in-memory/` — v1 mock adapters + synthetic post-trade seed executions.
- `composition.ts` — the single place adapters are bound.

## Integrations (through ports only)

Execution Engine · Smart Order Router · Order Management System · Live Trading Platform · Market Data
Platform · Performance Analytics Engine · Risk Analytics Engine · Monitoring Module · Configuration
Foundation · Validation Foundation · Workflow Engine.

## Boundaries

Broker-independent. **No** exchange SDK, broker SDK, FIX, REST/WebSocket transport or connectivity;
no persistence beyond the in-memory v1 adapters. Analysis is **post-trade** — the service never
contacts a venue. Every calculation is pure and reproducible (CP-4 / RP-1).

## Scripts

`pnpm --filter @services/tca-service typecheck | lint | test`
