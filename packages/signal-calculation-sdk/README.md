# @platform/signal-calculation-sdk (Phase 7.4)

The shared, **production** Signal Calculation library — real, deterministic, causal transformation
of quantitative **features** into standardized trading **signals**. Genuine computation code (not an
abstraction): it implements the actual signal-generation algorithms, built on top of
`@platform/feature-calculation-sdk` (every signal derives its features — SMA/EMA/RSI/MACD/Bollinger/
ATR/z-score/… — from that real library).

## Signals

- **Crossovers:** MA crossover, EMA crossover, MACD crossover, MACD histogram
- **Momentum & mean reversion:** RSI threshold, ROC signal, momentum breakout, z-score reversion
- **Breakouts & volatility:** Bollinger Band breakout, volatility (ATR-scaled) breakout
- **Filters:** volume confirmation, ATR (regime) filter, trend filter
- **Composites:** rule-engine composite, weighted signal aggregation, signal confidence scoring

## Engines

- **Threshold Engine** (`threshold-engine.ts`) — the crossover / band / level / breakout / gate
  evaluators every directional signal is built from.
- **Rule Engine** (`rule-engine.ts`) — a declarative comparator/rule-set/rule-signal evaluator over
  named operand series (`gt`/`lt`/`crosses_above`/…, `all`/`any`), used for multi-feature composites.

## Value semantics

Signals are `Float64Array` with `NaN` in the warm-up region. The **primary** output's value kind is:

- **direction** — `{ SHORT(-1), FLAT(0), LONG(+1) }` (most signals)
- **gate** — `{ 0, 1 }` (volume confirmation, ATR filter)
- **unit** — `[0, 1]` (confidence)

## Guarantees

- **Causal / point-in-time.** The signal at index `i` depends only on inputs at indices `≤ i`;
  no generator ever reads a future value (PIT-3 / CP-3). `crosses_*` look only at `i` and `i-1`.
- **Deterministic.** No randomness, no ambient state, no wall-clock reads.
- **NaN-aware.** Warm-up and `NaN` inputs propagate to `NaN` per each generator's policy.
- **Vectorized (batch)** `Float64Array` outputs, plus **streaming** `*Stream` classes that reproduce
  the batch result with O(1) incremental updates (for live recomputation).

## Scope

This engine **computes** signal values; it does **not** size positions, allocate capital or execute.
Those remain the exclusive domain of the downstream deterministic portfolio, risk and execution
engines that consume these standardized signals.

## Testing

`pnpm --filter @platform/signal-calculation-sdk test` runs the unit suite (hand-computed expected
values, rule-engine semantics, causality, and streaming-vs-batch consistency).
`pnpm --filter @platform/signal-calculation-sdk bench` runs the micro-benchmarks.
