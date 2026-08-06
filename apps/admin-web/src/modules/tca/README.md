# tca module (admin-web)

The **Transaction Cost Analysis** UI — execution-quality analytics for the admin console.

- `domain/` — `format`, `view-model`, `mappers`, `query` (pure presentation + view models).
- `data/` — the `TcaRepository` boundary, an in-memory `MockTcaRepository` and synthetic post-trade
  `seed` executions (the UI's own mock, independent of the service tier).
- `application/tca-view-service.ts` — the only layer hooks call; runs the **real** `@platform/tca-sdk`
  calculations and maps to view models. `container.ts` binds the mock repository.
- `hooks/use-tca.ts` — TanStack Query hooks (call the application service only).
- `components/` — the surface containers (13 dashboards + shared atoms/tables).

## Surfaces

TCA Dashboard · Execution Quality Dashboard · Slippage Analytics · Commission Analytics · Market
Impact Analytics · Benchmark Comparison · Execution Cost Explorer · Venue Comparison · Execution
Timeline · Execution Replay · Cost Reports · Cost Attribution · Execution Scorecards · Execution detail.

## Boundaries

Every number is a real, deterministic post-trade calculation from `@platform/tca-sdk`. The UI never
contacts the service tier, an exchange, a broker, a credential or persistence. Broker-independent —
no exchange/broker SDK, FIX or connectivity.
