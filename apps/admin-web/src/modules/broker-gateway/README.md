# broker-gateway module (admin-web)

The **Broker Gateway** UI — the broker/venue abstraction console for the admin app.

- `domain/` — `format`, `view-model`, `mappers`, `query` (pure presentation + view models).
- `data/` — the `GatewayRepository` boundary, a `MockGatewayRepository` and synthetic broker `seed`
  (the UI's own mock, independent of the service tier).
- `application/gateway-service.ts` — the only layer hooks call; runs the **real** `@platform/broker-sdk`
  rules (health, capability matrix, provider catalog) and maps to view models. `container.ts` binds
  the mock repository.
- `hooks/use-gateway.ts` — TanStack Query hooks (call the application service only).
- `components/` — the surface containers (13 dashboards + shared atoms/tables).

## Surfaces

Broker Dashboard · Broker Registry · Broker Health · Connectivity Monitor · Connection Manager ·
Session Manager · Account Manager · Position / Balance / Order Synchronization · Capability Explorer ·
Gateway Metrics · Gateway Audit · Broker detail.

## Boundaries

Every figure comes from the real, deterministic `@platform/broker-sdk` lifecycle/health/capability
rules. The UI never contacts the service tier, an exchange, a broker, a credential or persistence.
Provider-independent — no exchange/broker SDK, FIX or connectivity.
