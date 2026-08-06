# provider-bist

Placeholder broker/venue provider adapter for **Borsa İstanbul (BIST)**.

Declares the provider capability contracts via `@platform/broker-sdk` but implements **no** transport
— no exchange REST call, no WebSocket protocol, no FIX message. Injected into the broker-gateway
registry by id; swapping in a concrete adapter requires no gateway change.
