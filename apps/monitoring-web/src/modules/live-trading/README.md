# live-trading module (monitoring-web · Phase 6.12)

The monitoring-facing UI for the **Live Trading Platform** — read-only production
visibility into running strategies, deployment details, production health, trading metrics,
the trading timeline and emergency/kill-switch status. Reads through the shared vocabulary
in `@platform/trading-sdk`.

Self-contained copy of the layered stack; the monitoring mappers do not deep-link into
research-web modules (dependency/lineage cross-links render as plain labels).

## What it is (and is not)

- **Is:** read-only operational visibility. It consumes operational data exposed by the
  platform and never decides.
- **Is not:** a trading system. It contains **no** exchange/broker SDK, **no** API keys,
  **no** HTTP/WebSocket/FIX, and performs **no** order execution and **no** PnL/exposure
  computation. Emergency stop and the kill switch are surfaced as always-available human
  authorities; this console reflects status, never executes.

## Routes

`/live-trading` (dashboard + running) · `/[deploymentId]` (deployment details) ·
`/running` · `/health` · `/metrics` · `/timeline` · `/emergency`.
