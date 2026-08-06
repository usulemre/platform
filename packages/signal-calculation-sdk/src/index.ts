/**
 * @platform/signal-calculation-sdk — the shared, production Signal Calculation library.
 *
 * REAL, deterministic, causal (point-in-time) transformation of quantitative features into
 * standardized trading signals in `{ SHORT(-1), FLAT(0), LONG(+1) }` (plus non-directional gates
 * and `[0,1]` confidence). Built ON TOP OF `@platform/feature-calculation-sdk`: every signal derives
 * its underlying features (SMA/EMA/RSI/MACD/Bollinger/ATR/z-score/…) from that real library and
 * reduces them via the Threshold Engine and Rule Engine.
 *
 * Signal families: crossovers (MA/EMA/MACD/histogram), momentum & mean-reversion (RSI threshold,
 * ROC, momentum breakout, z-score reversion), breakouts (Bollinger, volatility), filters (volume
 * confirmation, ATR filter, trend filter) and composites (rule-engine composite, weighted
 * aggregation, confidence scoring). Every generator is vectorized (batch); incremental `*Stream`
 * classes reproduce the batch result for live updates.
 *
 * All generation is strictly causal — the signal at index `i` depends only on inputs at indices
 * `≤ i` (PIT-3 / CP-3) — and deterministic (no randomness, no ambient state). The `catalog`
 * describes each signal's inputs, parameters, outputs and the features it consumes.
 *
 * This engine COMPUTES signal values; it does not size positions, allocate capital or execute —
 * those remain the exclusive domain of the downstream deterministic portfolio, risk and execution
 * engines that consume these standardized signals.
 */
export * from './types';
export * from './threshold-engine';
export * from './rule-engine';
export * from './crossovers';
export * from './momentum-signals';
export * from './breakout-signals';
export * from './filters';
export * from './composite';
export * from './streaming';
export * from './catalog';
