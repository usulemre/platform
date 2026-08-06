# live-trading-service (Phase 6.12)

The canonical **Live Trading Platform** — the production trading platform that promotes
validated, paper-traded strategies into governed production. Consumed by the researcher
(research-web), administrator (admin-web) and monitoring (monitoring-web) UIs, speaking the
shared vocabulary from `@platform/trading-sdk`.

## Deployment lifecycle

```
Candidate Strategy → Deployment Request → Risk Approval → Deployment Approval →
Production Ready → Running → Paused → Stopped → Archived
```

Gates: **Risk Approval · Deployment Approval**. Controls: **restart · rollback ·
emergency stop · kill switch**. Default posture is **paper/shadow**; a live `Running`
deployment requires a valid, time-boxed authorization token. The **kill switch and
emergency stop are always available to authorized humans and are never gated by AI**
(HO-4).

## What it is (and is not)

- **Is:** an orchestration + governance + registry service over the deployment lifecycle,
  exposing the platform capabilities (account management, broker abstraction, strategy
  deployment, order orchestration, position/balance tracking, deployment governance,
  emergency controls, kill switch, production health, trading metrics, trading audit)
  through a pure domain layer and an application layer.
- **Is not:** a trading system. It contains **NO** exchange SDK, **NO** broker SDK, **NO**
  API keys, **NO** HTTP/REST client, **NO** WebSocket, **NO** FIX, and performs **no**
  order execution and **no** PnL/exposure computation, holding **no**
  persistence/cache/database. All broker/exchange access is an abstraction routed through
  the Broker Gateway port; concrete connectors belong to future infrastructure packages
  behind Connector Management. Credentials are referenced by opaque `credentialRef` only.
  Order states, quantities, prices, balances and metric VALUES are inert supplied data;
  risk/deployment approvals and authorizations are decided elsewhere (CP-5) and recorded to
  the Audit Center.

## Layering

```
src/application (LiveTradingService)
  → src/domain (discovery/search + lifecycle/runtime-controls + derivations)
  → src/infrastructure ports (Deployment/Family/Account/Connection query · Risk · Validation ·
    Authorization · BrokerGateway · Workflow · EventBus · Audit · Notification · Configuration)
```

Only **interfaces** touch infrastructure; concrete adapters are bound in
`src/composition.ts`. In v1 the only adapters are in-memory mocks — swapping in real
adapters requires no application/domain change.
