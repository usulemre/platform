import { describe, it, expect } from 'vitest';
import {
  MaCrossoverStream,
  RsiThresholdStream,
  maCrossover,
  rsiThresholdSignal,
  type StreamingSignal,
} from '../src/index';

/** Run a streaming signal over a series and collect its outputs. */
function stream(sig: StreamingSignal, values: readonly number[]): number[] {
  return values.map((v) => sig.push(v));
}

/** Assert a streamed output matches the batch output elementwise (NaN === NaN). */
function matchesBatch(streamed: readonly number[], batch: Float64Array): void {
  expect(streamed.length).toBe(batch.length);
  for (let i = 0; i < streamed.length; i += 1) {
    const b = batch[i]!;
    if (Number.isNaN(b)) expect(Number.isNaN(streamed[i]!)).toBe(true);
    else expect(streamed[i]!).toBe(b);
  }
}

const SERIES = Array.from(
  { length: 240 },
  (_, i) => 100 + Math.sin(i / 5) * 8 + (i % 7) - 3 + i * 0.04,
);

describe('streaming signals reproduce the batch result (incremental recomputation)', () => {
  it('MaCrossoverStream === maCrossover', () => {
    matchesBatch(stream(new MaCrossoverStream(12, 26), SERIES), maCrossover(SERIES, 12, 26));
  });

  it('RsiThresholdStream === rsiThresholdSignal', () => {
    matchesBatch(
      stream(new RsiThresholdStream(14, 30, 70), SERIES),
      rsiThresholdSignal(SERIES, 14, 30, 70),
    );
  });

  it('reset returns a stream to its initial state', () => {
    const s = new MaCrossoverStream(2, 4);
    stream(s, [1, 2, 3, 4]);
    s.reset();
    matchesBatch(stream(s, SERIES), maCrossover(SERIES, 2, 4));
  });

  it('handles NaN identically to the batch functions', () => {
    const withNan = [1, 2, NaN, 4, 5, 6, 7, 8, 9, 10];
    matchesBatch(stream(new MaCrossoverStream(2, 3), withNan), maCrossover(withNan, 2, 3));
  });
});
