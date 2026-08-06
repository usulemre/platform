/**
 * @platform/trading-sdk — the shared Live Trading Platform SDK.
 *
 * The single source of truth for the Live Trading Platform *vocabulary*: the deployment
 * lifecycle stages (candidate → deployment request → risk approval → deployment approval →
 * production ready → running → paused → stopped → archived), the runtime status + control
 * predicates (pause / resume / stop / restart / emergency-stop) and the always-available
 * kill switch, the canonical production order states (created → validated → submitted →
 * accepted → partially filled → filled / cancelled / rejected / expired), the broker
 * connector abstractions + initial provider placeholders (Binance, Hyperliquid, Deribit,
 * Interactive Brokers, Alpaca, BIST), the engine capabilities, the metric catalog
 * (descriptors only), the canonical models (Deployment, TradingAccount, BrokerConnection,
 * ExchangeConnection, TradingSession, RunningStrategy, TradingOrder, TradingPosition,
 * TradingPortfolio, AccountBalance, TradingPermission, TradingHealth, TradingMetric,
 * TradingAudit, EmergencyAction, KillSwitch, AuthorizationToken, DeploymentVersion,
 * DeploymentSnapshot, …), and pure identifier/version primitives. Consumed by the
 * live-trading service and its UIs.
 *
 * It contains NO exchange SDK, NO broker SDK, NO API keys, NO HTTP/REST client, NO
 * WebSocket, NO FIX, NO order execution, NO PnL/exposure computation, NO statistics, NO
 * persistence, NO caching, NO database access, and NO transport. Default posture is
 * paper/shadow; live execution requires a valid governance authorization token.
 */
export * from './stages';
export * from './statuses';
export * from './connectors';
export * from './capabilities';
export * from './metrics';
export * from './contracts';
export * from './identifiers';
