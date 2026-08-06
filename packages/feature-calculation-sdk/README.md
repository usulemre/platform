# @platform/feature-calculation-sdk (Phase 7.3)

The shared, **production** Feature Calculation library — real, deterministic, causal quantitative
feature calculations over typed OHLCV datasets. This is genuine computation code (not an
abstraction): it implements the actual algorithms.

## Calculations

- **Moving averages:** SMA, EMA (SMA-seeded), WMA, rolling mean
- **Rolling statistics:** sum, variance, standard deviation, max, min, median
- **Returns & normalization:** arithmetic returns, log returns, rate of change, momentum, z-score
- **Volatility:** true range, ATR (Wilder), Bollinger Bands
- **Oscillators:** RSI (Wilder), MACD (line / signal / histogram)
- **Volume:** VWAP (cumulative), rolling volume, dollar volume

## Guarantees

- **Causal / point-in-time.** The value at index `i` depends only on inputs at indices `≤ i`;
  no function ever reads a future value (PIT-3 / CP-3). Warm-up positions are `NaN`.
- **Deterministic.** No randomness, no ambient state, no wall-clock reads.
- **NaN-aware.** Each function documents its `NaN` policy; window functions propagate `NaN`
  when any value inside the window is `NaN`.
- **Vectorized (batch)** `Float64Array` outputs, plus **streaming** `*Stream` classes that
  reproduce the batch result with O(1) incremental updates (for live recomputation).
- **Allocation-conscious.** Single output allocation per call; O(n) rolling accumulators;
  amortized-O(n) monotonic-deque max/min.

## Conventions

- Windows are positive integers (`assertWindow` throws otherwise).
- `rollingVariance`/`rollingStd`/`zScore` default to the **sample** statistic (`ddof = 1`);
  `bollingerBands` uses the **population** std (`ddof = 0`, TA-Lib convention).
- EMA/ATR/RSI seed with the simple mean of the first full finite window (TA-Lib / Wilder style).

## Testing

`pnpm --filter @platform/feature-calculation-sdk test` runs the unit suite (hand-computed
expected values, NaN handling, causality, and streaming-vs-batch consistency).
`pnpm --filter @platform/feature-calculation-sdk bench` runs the micro-benchmarks.
