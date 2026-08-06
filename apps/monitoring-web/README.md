# @apps/monitoring-web

Monitoring console (Next.js 15, App Router). Human console for production
monitoring, drift/parity, alerting and incident visibility; surfaces halt state
read-only (the risk engine decides halts). Acts only through governed service
APIs — no decision logic. Application shell only.

Canonical successor to the `apps/monitoring-ui` Phase-0 placeholder (merged here
during the Architecture V2 application-layer normalization).

- Owner: HSRE. Architecture: User Applications (Architecture V2 §5.9).
- Dependencies (inward, contract-first): monitoring-service, risk-service (read),
  contracts/api. No decision/validation/risk/allocation/execution logic here.
