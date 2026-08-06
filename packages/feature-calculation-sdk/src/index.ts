/**
 * @platform/feature-calculation-sdk — the shared, production Feature Calculation library.
 *
 * REAL, deterministic, causal (point-in-time) quantitative feature calculations over typed
 * OHLCV datasets: moving averages (SMA/EMA/WMA), rolling statistics (mean/median/variance/std/
 * max/min/sum), returns and normalization (arithmetic/log returns, ROC, momentum, z-score),
 * volatility (true range, ATR, Bollinger Bands), oscillators (RSI, MACD) and volume features
 * (VWAP, rolling volume, dollar volume). Every function is vectorized (batch) and NaN-aware;
 * incremental `*Stream` classes provide O(1) streaming updates that reproduce the batch results.
 *
 * All calculations are strictly causal — the value at index `i` depends only on inputs at
 * indices `≤ i`, never the future (PIT-3 / CP-3) — and deterministic (no randomness, no ambient
 * state). The `catalog` describes each feature's inputs, parameters and outputs.
 */
export * from './types';
export * from './moving-averages';
export * from './rolling';
export * from './returns';
export * from './volatility';
export * from './oscillators';
export * from './volume';
export * from './streaming';
export * from './catalog';
