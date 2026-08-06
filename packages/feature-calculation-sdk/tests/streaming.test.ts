import { describe, it, expect } from 'vitest';
import {
  EmaStream,
  RollingStdStream,
  RollingSumStream,
  RsiStream,
  SmaStream,
  ema,
  rollingStd,
  rollingSum,
  rsi,
  sma,
  type StreamingFeature,
} from '../src/index';

/** Run a streaming calculator over a series and collect its outputs. */
function stream(calc: StreamingFeature, values: readonly number[]): number[] {
  return values.map((v) => calc.push(v));
}

/** Assert a streamed output matches the batch output elementwise (NaN === NaN). */
function matchesBatch(streamed: readonly number[], batch: Float64Array): void {
  expect(streamed.length).toBe(batch.length);
  for (let i = 0; i < streamed.length; i += 1) {
    const b = batch[i]!;
    if (Number.isNaN(b)) expect(Number.isNaN(streamed[i]!)).toBe(true);
    else expect(streamed[i]!).toBeCloseTo(b, 9);
  }
}

const SERIES = Array.from(
  { length: 200 },
  (_, i) => 100 + Math.sin(i / 5) * 8 + (i % 7) - 3 + i * 0.05,
);

describe('streaming calculators reproduce the batch result (incremental recomputation)', () => {
  it('SmaStream === sma', () => {
    matchesBatch(stream(new SmaStream(20), SERIES), sma(SERIES, 20));
  });

  it('RollingSumStream === rollingSum', () => {
    matchesBatch(stream(new RollingSumStream(15), SERIES), rollingSum(SERIES, 15));
  });

  it('RollingStdStream === rollingStd (sample)', () => {
    matchesBatch(stream(new RollingStdStream(20, 1), SERIES), rollingStd(SERIES, 20, 1));
  });

  it('EmaStream === ema', () => {
    matchesBatch(stream(new EmaStream(20), SERIES), ema(SERIES, 20));
  });

  it('RsiStream === rsi', () => {
    matchesBatch(stream(new RsiStream(14), SERIES), rsi(SERIES, 14));
  });

  it('reset returns a stream to its initial state', () => {
    const s = new SmaStream(3);
    stream(s, [1, 2, 3, 4]);
    s.reset();
    matchesBatch(stream(s, [1, 2, 3, 4, 5]), sma([1, 2, 3, 4, 5], 3));
  });

  it('handles NaN identically to the batch functions', () => {
    const withNan = [1, 2, NaN, 4, 5, 6, 7, 8];
    matchesBatch(stream(new SmaStream(3), withNan), sma(withNan, 3));
    matchesBatch(stream(new EmaStream(3), withNan), ema(withNan, 3));
  });
});
