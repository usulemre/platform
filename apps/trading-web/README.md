# trading-web (Phase 7.6)

The **Order Management System (OMS)** console — the trading desk's window onto every order's complete
lifecycle. A standalone Next.js 15 app (App Router, TypeScript, Tailwind, shadcn/ui via
`@platform/ui`, TanStack Query). It reads the OMS through an application service over a repository;
its data layer is an inert mock built on the real `@platform/order-sdk` state machine (orders are
constructed by walking legal lifecycle paths, so their event logs replay consistently).

## Surfaces (`/`, `/orders/*`)

Order Dashboard (`/`) · Order Blotter · Active / Completed / Rejected / Cancelled orders · Order
Search · Order Timeline · Order Audit · Order Replay · Order Metrics · Order Health · Order detail
(`/orders/[orderId]`).

## What it is (and is not)

- **Is:** presentation of order state. The lifecycle logic (the state machine, transitions, actions,
  fills) lives in `@platform/order-sdk` and the `order-management-service`.
- **Is not:** it holds no broker, exchange or FIX connectivity, no credentials, no order execution
  and no persistence. Routing to an execution venue happens downstream. This console is read-only.

Dev server: `pnpm --filter @apps/trading-web dev` (port 3004).
