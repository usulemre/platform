/**
 * @platform/market-data-sdk — the shared Market Data SDK.
 *
 * The single source of truth for the market-data *vocabulary*: canonical asset
 * classes, timeframes, market-data types, platform capabilities, shared status
 * enums, the canonical data models (asset, exchange, instrument, contract,
 * symbol, dataset, time series, calendar, session, …), and pure symbol-resolution
 * primitives. Consumed by both the market-data service and its administration UI.
 *
 * It contains NO exchange-specific logic, NO provider SDKs, NO persistence, and
 * NO transport.
 */
export * from './asset-classes';
export * from './timeframes';
export * from './market-data-types';
export * from './capabilities';
export * from './statuses';
export * from './contracts';
export * from './symbols';
