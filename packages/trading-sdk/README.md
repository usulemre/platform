# @platform/trading-sdk (Phase 6.12)

The shared **Live Trading Platform** SDK — the single source of truth for the platform
_vocabulary_ spoken by the `live-trading-service` and the researcher (research-web),
administrator (admin-web) and monitoring (monitoring-web) UIs.

## Deployment lifecycle

```
Candidate Strategy → Deployment Request → Risk Approval → Deployment Approval →
Production Ready → Running → Paused → Stopped → Archived
```

Gates: **Risk Approval · Deployment Approval** (the latter issues a time-boxed
authorization token). Controls: **restart · rollback · emergency stop · kill switch** —
the kill switch and emergency stop are ALWAYS available to authorized humans and are never
gated by AI. Default posture is **paper/shadow**; a live `Running` deployment requires a
valid authorization token.

## Order states

```
Created → Validated → Submitted → Accepted → Partially Filled → Filled
                                            ↘ Cancelled / Rejected / Expired
```

## Broker abstractions (no SDKs)

Kinds: crypto exchange · traditional broker · options broker · futures broker · forex
broker. Initial provider **placeholders** (abstractions only, never wired): Binance,
Hyperliquid, Deribit, Interactive Brokers, Alpaca, BIST.

## What it is (and is not)

- **Is:** the lifecycle/runtime/order vocabularies, connector abstractions, capabilities, a
  metric **catalog** (descriptors only) and the canonical models (`Deployment`,
  `TradingAccount`, `BrokerConnection`, `RunningStrategy`, `TradingOrder`,
  `TradingPosition`, `TradingPortfolio`, `AccountBalance`, `KillSwitch`,
  `AuthorizationToken`, …) plus pure identifier/version helpers.
- **Is not:** a trading system. It contains **NO** exchange SDK, **NO** broker SDK, **NO**
  API keys, **NO** HTTP/REST client, **NO** WebSocket, **NO** FIX, **NO** order execution,
  **NO** PnL/exposure computation, and **no** persistence, cache, database or transport.
  Strategies, portfolios and accounts are referenced by **ref**; credentials are referenced
  by opaque `credentialRef` only; quantities, prices, balances and metric values are inert
  supplied strings. Actual exchange implementations belong to future infrastructure
  packages behind these abstractions.
