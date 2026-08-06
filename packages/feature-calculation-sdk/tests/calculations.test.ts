import { describe, it, expect } from 'vitest';
import {
  arithmeticReturns,
  atr,
  bollingerBands,
  dollarVolume,
  ema,
  logReturns,
  macd,
  momentum,
  rateOfChange,
  rollingMax,
  rollingMedian,
  rollingMin,
  rollingStd,
  rollingSum,
  rollingVariance,
  rollingVolume,
  rsi,
  sma,
  trueRange,
  vwap,
  wma,
  zScore,
} from '../src/index';

/** Compare two series where NaN === NaN and finite values match within tolerance. */
function seriesClose(actual: Float64Array, expected: readonly number[], tol = 1e-9): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i += 1) {
    const e = expected[i]!;
    if (Number.isNaN(e)) expect(Number.isNaN(actual[i]!)).toBe(true);
    else expect(actual[i]!).toBeCloseTo(e, 9);
  }
  void tol;
}

describe('moving averages', () => {
  it('sma is the rolling arithmetic mean with NaN warm-up', () => {
    seriesClose(sma([1, 2, 3, 4, 5], 3), [NaN, NaN, 2, 3, 4]);
  });

  it('ema seeds with the SMA of the first window (alpha = 2/(w+1))', () => {
    // window 3 → alpha 0.5; seed at idx2 = mean(1,2,3)=2; idx3=0.5*4+0.5*2=3; idx4=0.5*5+0.5*3=4
    seriesClose(ema([1, 2, 3, 4, 5], 3), [NaN, NaN, 2, 3, 4]);
  });

  it('wma weights recent values more heavily', () => {
    seriesClose(wma([1, 2, 3], 2), [NaN, 5 / 3, 8 / 3]);
  });

  it('throws on a non-positive window', () => {
    expect(() => sma([1, 2, 3], 0)).toThrow(RangeError);
    expect(() => sma([1, 2, 3], 1.5)).toThrow(RangeError);
  });
});

describe('rolling statistics', () => {
  it('rolling sum', () => {
    seriesClose(rollingSum([1, 2, 3, 4], 2), [NaN, 3, 5, 7]);
  });

  it('rolling variance (sample and population) and std', () => {
    seriesClose(rollingVariance([2, 4, 6], 3, 1), [NaN, NaN, 4]);
    seriesClose(rollingVariance([2, 4, 6], 3, 0), [NaN, NaN, 8 / 3]);
    seriesClose(rollingStd([2, 4, 6], 3, 1), [NaN, NaN, 2]);
  });

  it('rolling max/min via monotonic deque', () => {
    seriesClose(rollingMax([1, 3, 2, 5, 4], 3), [NaN, NaN, 3, 5, 5]);
    seriesClose(rollingMin([1, 3, 2, 5, 4], 3), [NaN, NaN, 1, 2, 2]);
  });

  it('rolling median (odd and even windows)', () => {
    seriesClose(rollingMedian([1, 3, 2, 5, 4], 3), [NaN, NaN, 2, 3, 4]);
    seriesClose(rollingMedian([1, 2, 3, 4], 2), [NaN, 1.5, 2.5, 3.5]);
  });
});

describe('returns and normalization', () => {
  it('arithmetic and log returns', () => {
    seriesClose(arithmeticReturns([100, 110, 99]), [NaN, 0.1, -0.1]);
    seriesClose(logReturns([1, Math.E, Math.E * Math.E]), [NaN, 1, 1]);
  });

  it('rate of change and momentum over a window', () => {
    seriesClose(rateOfChange([100, 110, 121], 1), [NaN, 10, 10]);
    seriesClose(momentum([1, 2, 4, 7], 2), [NaN, NaN, 3, 5]);
  });

  it('rolling z-score standardizes against the rolling mean/std', () => {
    seriesClose(zScore([2, 4, 6], 3, 1), [NaN, NaN, 1]);
  });

  it('guards divide-by-zero (returns NaN, not Infinity)', () => {
    expect(Number.isNaN(arithmeticReturns([0, 1])[1]!)).toBe(true);
    expect(Number.isNaN(rateOfChange([0, 1], 1)[1]!)).toBe(true);
  });
});

describe('volatility', () => {
  it('true range uses the prior close', () => {
    seriesClose(trueRange([10, 12], [8, 9], [9, 11]), [2, 3]);
  });

  it('ATR is the Wilder-smoothed true range', () => {
    const a = atr([10, 12, 14, 13], [8, 9, 10, 11], [9, 11, 13, 12], 2);
    // TR = [2,3,4,2]; seed idx1 = 2.5; idx2 = (2.5+4)/2 = 3.25; idx3 = (3.25+2)/2 = 2.625
    seriesClose(a, [NaN, 2.5, 3.25, 2.625]);
  });

  it('Bollinger Bands envelope the SMA by k population std devs', () => {
    const bb = bollingerBands([2, 4, 6], 3, 2, 0);
    expect(bb.middle[2]!).toBeCloseTo(4, 9);
    expect(bb.upper[2]!).toBeCloseTo(4 + 2 * Math.sqrt(8 / 3), 9);
    expect(bb.lower[2]!).toBeCloseTo(4 - 2 * Math.sqrt(8 / 3), 9);
  });
});

describe('oscillators', () => {
  it('RSI is 100 for a monotonic rise and 50 for a balanced window', () => {
    expect(rsi([1, 2, 3, 4, 5], 2)[4]!).toBeCloseTo(100, 9);
    expect(rsi([1, 2, 1, 2, 1, 2], 2)[2]!).toBeCloseTo(50, 9);
  });

  it('MACD line equals EMA(fast) − EMA(slow) and has correct warm-up', () => {
    const values = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i / 3) * 5 + i * 0.2);
    const result = macd(values, 3, 6, 4);
    const fast = ema(values, 3);
    const slow = ema(values, 6);
    expect(result.macd.length).toBe(values.length);
    for (let i = 0; i < values.length; i += 1) {
      if (!Number.isNaN(fast[i]!) && !Number.isNaN(slow[i]!)) {
        expect(result.macd[i]!).toBeCloseTo(fast[i]! - slow[i]!, 9);
      }
    }
    // histogram = macd − signal wherever both defined
    for (let i = 0; i < values.length; i += 1) {
      if (!Number.isNaN(result.macd[i]!) && !Number.isNaN(result.signal[i]!)) {
        expect(result.histogram[i]!).toBeCloseTo(result.macd[i]! - result.signal[i]!, 9);
      }
    }
  });
});

describe('volume', () => {
  it('cumulative VWAP', () => {
    seriesClose(vwap([10, 20], [8, 18], [9, 19], [100, 300]), [9, 16.5]);
  });

  it('rolling volume and dollar volume', () => {
    seriesClose(rollingVolume([10, 20, 30], 2), [NaN, 30, 50]);
    seriesClose(dollarVolume([2, 3], [100, 200]), [200, 600]);
  });
});

describe('NaN handling', () => {
  it('window functions propagate NaN inside the window', () => {
    seriesClose(sma([1, NaN, 3, 4], 2), [NaN, NaN, NaN, 3.5]);
    seriesClose(rollingMax([1, NaN, 3, 4], 2), [NaN, NaN, NaN, 4]);
  });

  it('ema resumes seeding after leading NaNs', () => {
    const out = ema([NaN, NaN, 1, 2, 3, 4, 5], 3);
    // seeds at idx4 = mean(1,2,3)=2; idx5=0.5*4+0.5*2=3; idx6=0.5*5+0.5*3=4
    seriesClose(out, [NaN, NaN, NaN, NaN, 2, 3, 4]);
  });
});

describe('causality (point-in-time, no look-ahead)', () => {
  it('a future value never changes a past output', () => {
    const base = [1, 2, 3, 4, 5];
    const perturbed = [1, 2, 3, 4, 999];
    const a = sma(base, 3);
    const b = sma(perturbed, 3);
    for (let i = 0; i < 4; i += 1) expect(a[i]!).toBe(b[i]!); // indices 0..3 unaffected by index 4
    const ra = rsi(base, 2);
    const rb = rsi(perturbed, 2);
    for (let i = 0; i < 4; i += 1) {
      if (Number.isNaN(ra[i]!)) expect(Number.isNaN(rb[i]!)).toBe(true);
      else expect(ra[i]!).toBe(rb[i]!);
    }
  });

  it('is deterministic across repeated runs', () => {
    const values = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i));
    const a = bollingerBands(values, 20, 2);
    const b = bollingerBands(values, 20, 2);
    expect(Array.from(a.upper)).toEqual(Array.from(b.upper));
  });
});
