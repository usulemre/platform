/**
 * @platform/tca-sdk — the shared, production Transaction Cost Analysis (TCA) library.
 *
 * REAL, deterministic post-trade cost calculations over an execution's fills and benchmark prices:
 * average and weighted-average execution price, participation and fill rate; slippage and eight-
 * benchmark comparison (arrival, decision, VWAP, TWAP, close, open, mid, last); effective and
 * realized spread; the additive permanent/temporary market-impact decomposition; Perold
 * implementation shortfall; the additive cost breakdown and attribution; execution efficiency and a
 * 0–100 execution-quality score with a letter grade; and notional-weighted per-venue and portfolio
 * aggregation. The `analyzeExecution` entry point composes them into the canonical
 * `ExecutionAnalytics`.
 *
 * Every function is pure and deterministic — no randomness, no wall-clock, no market-data feed —
 * and given identical inputs always returns identical outputs (CP-4 / RP-1). The library is
 * broker-independent: NO exchange SDK, NO broker SDK, NO FIX, NO REST/WebSocket transport, NO
 * connectivity. Cost sign convention: a cost is positive when unfavorable.
 */
export * from './types';
export { BPS } from './constants';
export * from './prices';
export * from './slippage';
export * from './spread';
export * from './impact';
export * from './shortfall';
export * from './cost';
export * from './scoring';
export * from './analytics';
export * from './aggregate';
export * from './catalog';
