# live-trading module (research-web · Phase 6.12)

The researcher-facing UI for the **Live Trading Platform**. A fully layered module that
renders the deployment lifecycle, deployment registry, deployment details (runtime +
controls, account, connection, session, authorization, orders, positions, portfolio,
balances, permissions, health, metrics, timeline, approvals, emergency controls + kill
switch, lineage, audit), running strategies, production orders, open/closed positions,
portfolio overview and deployment history — reading through the shared vocabulary in
`@platform/trading-sdk`.

## Layering

```
components (Client Components)
  → hooks (TanStack Query + Zustand list controls)
  → application (LiveTradingAdminService: DTO → view-model)
  → data (repository interface · Mock adapter + seed · Api adapter)
  → domain (dto · query · view-model · mappers)
```

The app depends on this module only through the container components exported from
`index.ts`. In v1 the composition root binds the **Mock** repository (its own synthetic
seed); swap in `ApiLiveTradingRepository` (over the live-trading service gateway) to go
live — no component/hook/service change.

## What it is (and is not)

- **Is:** presentation. All labels, tones, stage steps, progress, order/position tables,
  control availability (incl. the always-available emergency stop and kill switch) are
  derived by pure mappers so components stay logic-free.
- **Is not:** a trading system. It never contacts an exchange or broker, holds no API keys,
  speaks no HTTP/WebSocket/FIX, and computes no PnL/exposure. Order states, quantities,
  prices, balances and metric values are inert supplied data; credentials are opaque
  references; deployments run through the broker gateway abstraction and
  approvals/authorizations are decided elsewhere — reflected here, never executed here.

## Routes

`/live-trading` (dashboard + registry) · `/[deploymentId]` (deployment details) ·
`/running` (running strategies + production orders) · `/portfolio` (positions + balances) ·
`/history` (deployment history).
