import { describe, it, expect } from 'vitest';
import { bollingerBands, macd } from '@platform/feature-calculation-sdk';
import {
  atrFilter,
  bollingerBreakout,
  compositeSignal,
  confidenceScore,
  crossoverSignal,
  emaCrossover,
  evaluateRule,
  isValidSignalValue,
  levelSignal,
  maCrossover,
  macdCrossover,
  macdHistogramSignal,
  momentumBreakout,
  rocSignal,
  rsiThresholdSignal,
  ruleSignal,
  signalDistribution,
  thresholdSignal,
  toOhlcvSeries,
  trendFilter,
  volatilityBreakout,
  volumeConfirmation,
  weightedAggregate,
  zScoreReversion,
  type WeightedSignal,
} from '../src/index';

/** Assert a signal series matches expected values elementwise (NaN === NaN). */
function signalEq(actual: Float64Array, expected: readonly number[]): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i += 1) {
    const e = expected[i]!;
    if (Number.isNaN(e)) expect(Number.isNaN(actual[i]!)).toBe(true);
    else expect(actual[i]!).toBeCloseTo(e, 9);
  }
}

describe('threshold engine', () => {
  it('crossoverSignal is the sign of (fast - slow)', () => {
    signalEq(crossoverSignal([1, 2, 3], [3, 2, 1]), [-1, 0, 1]);
  });

  it('thresholdSignal maps a band (oversold long / overbought short)', () => {
    signalEq(
      thresholdSignal([10, 50, 90], {
        lower: 30,
        upper: 70,
        belowLowerSignal: 1,
        aboveUpperSignal: -1,
      }),
      [1, 0, -1],
    );
  });

  it('levelSignal applies a symmetric dead-zone around a level', () => {
    signalEq(levelSignal([-2, 0, 2], 0, 1, -1, 1), [-1, 0, 1]);
  });
});

describe('rule engine', () => {
  it('evaluateRule: gt against a constant', () => {
    signalEq(evaluateRule({ left: 'a', op: 'gt', right: 2 }, { a: [1, 3, 2] }), [0, 1, 0]);
  });

  it('evaluateRule: crosses_above is causal (needs the prior bar)', () => {
    signalEq(evaluateRule({ left: 'a', op: 'crosses_above', right: 2 }, { a: [1, 2, 3] }), [
      NaN,
      0,
      1,
    ]);
  });

  it('ruleSignal resolves long/short rule-sets to a direction', () => {
    const bindings = { a: [1, 2, 3, 4], b: [4, 3, 2, 1] };
    const signal = ruleSignal(
      {
        long: { combine: 'all', rules: [{ left: 'a', op: 'gt', right: { ref: 'b' } }] },
        short: { combine: 'all', rules: [{ left: 'a', op: 'lt', right: { ref: 'b' } }] },
      },
      bindings,
    );
    signalEq(signal, [-1, -1, 1, 1]);
  });
});

describe('crossover signals', () => {
  it('maCrossover is long while the fast SMA leads the slow SMA', () => {
    signalEq(maCrossover([1, 2, 3, 4, 5, 6], 2, 3), [NaN, NaN, 1, 1, 1, 1]);
  });

  it('maCrossover flips short when the fast SMA falls below the slow SMA', () => {
    expect(maCrossover([5, 4, 3, 4, 5, 6], 2, 3)[2]!).toBe(-1);
  });

  it('emaCrossover requires fast < slow', () => {
    expect(() => emaCrossover([1, 2, 3], 5, 5)).toThrow(RangeError);
  });

  it('macdCrossover equals sign(macd - signal) wherever both are finite', () => {
    const values = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 4) * 6 + i * 0.15);
    const signal = macdCrossover(values, 5, 12, 4);
    const m = macd(values, 5, 12, 4);
    for (let i = 0; i < values.length; i += 1) {
      if (!Number.isNaN(m.macd[i]!) && !Number.isNaN(m.signal[i]!)) {
        expect(signal[i]!).toBe(Math.sign(m.macd[i]! - m.signal[i]!));
      }
    }
  });

  it('macdHistogram is the sign of the histogram', () => {
    const values = Array.from({ length: 60 }, (_, i) => 100 + Math.cos(i / 5) * 4 + i * 0.1);
    const signal = macdHistogramSignal(values, 5, 12, 4);
    const m = macd(values, 5, 12, 4);
    for (let i = 0; i < values.length; i += 1) {
      if (!Number.isNaN(m.histogram[i]!)) expect(signal[i]!).toBe(Math.sign(m.histogram[i]!));
    }
  });
});

describe('momentum & mean-reversion signals', () => {
  it('rsiThreshold shorts an overbought (monotonic-up) series and longs an oversold one', () => {
    signalEq(rsiThresholdSignal([1, 2, 3, 4, 5], 2), [NaN, NaN, -1, -1, -1]);
    signalEq(rsiThresholdSignal([5, 4, 3, 2, 1], 2), [NaN, NaN, 1, 1, 1]);
  });

  it('rocSignal is long on positive rate of change', () => {
    signalEq(rocSignal([100, 110, 121], 1, 0), [NaN, 1, 1]);
  });

  it('momentumBreakout only fires beyond the threshold', () => {
    signalEq(momentumBreakout([1, 2, 4, 7], 2, 4), [NaN, NaN, 0, 1]);
  });

  it('zScoreReversion is contrarian (short when z is high)', () => {
    expect(zScoreReversion([2, 4, 6], 3, 0.5)[2]!).toBe(-1);
  });
});

describe('breakout & volatility signals', () => {
  it('bollingerBreakout matches the band breakout rule', () => {
    const values = Array.from(
      { length: 40 },
      (_, i) => 100 + Math.sin(i / 2) * 3 + (i === 30 ? 20 : 0),
    );
    const signal = bollingerBreakout(values, 20, 2);
    const bands = bollingerBands(values, 20, 2);
    for (let i = 0; i < values.length; i += 1) {
      if (Number.isNaN(bands.upper[i]!)) {
        expect(Number.isNaN(signal[i]!)).toBe(true);
      } else {
        const expected = values[i]! > bands.upper[i]! ? 1 : values[i]! < bands.lower[i]! ? -1 : 0;
        expect(signal[i]!).toBe(expected);
      }
    }
  });

  it('volatilityBreakout produces only valid direction values', () => {
    const n = 50;
    const high = Array.from({ length: n }, (_, i) => 101 + Math.sin(i));
    const low = Array.from({ length: n }, (_, i) => 99 + Math.sin(i));
    const close = Array.from({ length: n }, (_, i) => 100 + Math.sin(i));
    const signal = volatilityBreakout(high, low, close, 14, 1);
    for (const v of signal)
      if (Number.isFinite(v)) expect(isValidSignalValue(v, 'direction')).toBe(true);
  });
});

describe('filter signals', () => {
  it('volumeConfirmation gates on above-average volume', () => {
    signalEq(volumeConfirmation([100, 100, 100, 1000], 2, 1.5), [NaN, 0, 0, 1]);
  });

  it('atrFilter is a {0,1} gate', () => {
    const n = 40;
    const high = Array.from({ length: n }, (_, i) => 101 + (i % 3));
    const low = Array.from({ length: n }, (_, i) => 99 - (i % 3));
    const close = Array.from({ length: n }, () => 100);
    const signal = atrFilter(high, low, close, 14, 0.005);
    for (const v of signal)
      if (Number.isFinite(v)) expect(isValidSignalValue(v, 'gate')).toBe(true);
  });

  it('trendFilter is long above the SMA', () => {
    signalEq(trendFilter([1, 2, 3, 4, 5], 3), [NaN, NaN, 1, 1, 1]);
  });
});

describe('composite & aggregation', () => {
  const subs: WeightedSignal[] = [
    { signal: new Float64Array([1, 1, -1]), weight: 1 },
    { signal: new Float64Array([1, -1, -1]), weight: 1 },
    { signal: new Float64Array([1, 1, 1]), weight: 1 },
  ];

  it('weightedAggregate thresholds the weighted vote', () => {
    const result = weightedAggregate(subs, 0.5);
    signalEq(result.signal, [1, 0, 0]);
    expect(result.score[0]!).toBeCloseTo(1, 9);
    expect(result.score[1]!).toBeCloseTo(1 / 3, 9);
  });

  it('confidenceScore is full agreement when all sub-signals concur', () => {
    const conf = confidenceScore(subs);
    expect(conf[0]!).toBeCloseTo(1, 9);
    expect(conf[1]!).toBeCloseTo(2 / 3, 9);
  });

  it('compositeSignal (rule engine) produces valid directions over OHLCV', () => {
    const bars = Array.from({ length: 120 }, (_, i) => {
      const price = 100 + Math.sin(i / 6) * 8 + i * 0.1;
      return {
        time: i,
        open: price,
        high: price + 1,
        low: price - 1,
        close: price,
        volume: 1000 + (i % 5) * 800,
      };
    });
    const signal = compositeSignal(toOhlcvSeries(bars), { fast: 5, slow: 15, trend: 30 });
    expect(signal.length).toBe(bars.length);
    for (const v of signal)
      if (Number.isFinite(v)) expect(isValidSignalValue(v, 'direction')).toBe(true);
    expect(signalDistribution(signal).finite).toBeGreaterThan(0);
  });
});

describe('causality (point-in-time, no look-ahead) & determinism', () => {
  it('a future value never changes a past signal', () => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8];
    const perturbed = [1, 2, 3, 4, 5, 6, 7, 999];
    const a = maCrossover(base, 2, 4);
    const b = maCrossover(perturbed, 2, 4);
    for (let i = 0; i < 7; i += 1) {
      if (Number.isNaN(a[i]!)) expect(Number.isNaN(b[i]!)).toBe(true);
      else expect(a[i]!).toBe(b[i]!);
    }
  });

  it('is deterministic across repeated runs', () => {
    const values = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 3) * 5);
    expect(Array.from(rsiThresholdSignal(values, 14))).toEqual(
      Array.from(rsiThresholdSignal(values, 14)),
    );
  });
});
