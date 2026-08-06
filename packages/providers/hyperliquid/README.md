# provider-hyperliquid

Placeholder broker/venue provider adapter for **Hyperliquid**.

Declares the provider capability contracts via `@platform/broker-sdk` but implements **no** transport
— no exchange REST call, no WebSocket protocol, no FIX message. Injected into the broker-gateway
registry by id; swapping in a concrete adapter requires no gateway change.
