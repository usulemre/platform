# live-trading module (admin-web · Phase 6.12)

The administrator-facing UI for the **Live Trading Platform**. Renders the deployment
registry, deployment details, trading accounts, exchange/broker connection abstractions +
provider placeholders, the deployment approval queue, emergency controls + kill switch and
the trading audit — reading through the shared vocabulary in `@platform/trading-sdk`.

Self-contained copy of the layered stack; the admin mappers do not deep-link into
research-web modules (dependency/lineage cross-links render as plain labels).

## What it is (and is not)

- **Is:** presentation + administration surfaces. Emergency stop and the kill switch are
  surfaced as always-available human authorities (never gated by AI).
- **Is not:** a trading system. It contains **no** exchange/broker SDK, **no** API keys,
  **no** HTTP/WebSocket/FIX, and performs **no** order execution and **no** PnL/exposure
  computation. Credentials are opaque references; deployments run through the broker gateway
  abstraction; approvals/authorizations are decided elsewhere — reflected here, never
  executed here.

## Routes

`/live-trading` (dashboard + registry) · `/[deploymentId]` (deployment details) ·
`/accounts` · `/connections` · `/approvals` · `/emergency` · `/audit`.
