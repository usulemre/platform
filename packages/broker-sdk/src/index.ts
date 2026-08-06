/**
 * @platform/broker-sdk — the shared Broker Gateway SDK.
 *
 * The single source of truth for the Broker Gateway *vocabulary, lifecycle rules, capability
 * contracts and provider catalog*: the broker lifecycle state machine (registered → configured →
 * authenticated → connected → healthy ↔ degraded → disconnected → archived), the lifecycle actions
 * (reconnect / failover / health check / heartbeat / recovery), the ten canonical **capability
 * contracts** (submit / cancel / replace / query order, query positions / balances, market-data
 * subscription, historical data, account information, heartbeat), the ten **provider descriptors**
 * (Binance, Binance Futures, Hyperliquid, Deribit, Interactive Brokers, Alpaca, BIST, FIX, generic
 * REST, generic WebSocket), the **provider interface** (`BrokerProviderPort`) with a placeholder
 * factory, deterministic **health computation**, and the canonical domain models (Broker,
 * BrokerConnection, BrokerSession, BrokerAccount, BrokerCapability, BrokerHealth, BrokerStatus,
 * BrokerMetrics, BrokerEvent, BrokerAudit, GatewayConfiguration, GatewaySession).
 *
 * It contains NO exchange SDK, NO broker SDK, NO FIX, NO REST/WebSocket transport, NO persistence and
 * NO connectivity. The transition table, action predicates, capability vocabulary and health rules
 * are REAL deterministic rules; transitions are applied by the broker-gateway service, and any venue
 * connectivity happens in an injected provider adapter behind the capability contract — never here.
 */
export * from './lifecycle';
export * from './capabilities';
export * from './providers';
export * from './types';
export * from './ports';
export * from './health';
export * from './identifiers';
