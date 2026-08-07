import { describe, expect, it } from 'vitest';
import { DuplicateDetector, SequenceValidator, detectGap } from '../src/index';

describe('detectGap', () => {
  it('reports contiguity for the next sequence', () => {
    expect(detectGap(10, 11)).toEqual({ contiguous: true, expected: 11, received: 11, missing: 0 });
  });

  it('reports a gap with the missing count', () => {
    expect(detectGap(10, 14)).toEqual({
      contiguous: false,
      expected: 11,
      received: 14,
      missing: 3,
    });
  });

  it('honours a custom step', () => {
    expect(detectGap(10, 12, 2).contiguous).toBe(true);
  });
});

describe('SequenceValidator', () => {
  it('treats the first event as first and advances', () => {
    const v = new SequenceValidator();
    expect(v.classify('s', 5).status).toBe('first');
    expect(v.peek('s')).toBe(5);
  });

  it('detects in-order, duplicate and out-of-order', () => {
    const v = new SequenceValidator();
    v.classify('s', 5);
    expect(v.classify('s', 6).status).toBe('in_order');
    expect(v.classify('s', 6).status).toBe('duplicate');
    expect(v.classify('s', 4).status).toBe('out_of_order');
  });

  it('flags a gap for contiguous streams', () => {
    const v = new SequenceValidator();
    v.classify('s', 5, { contiguous: true });
    const check = v.classify('s', 8, { contiguous: true });
    expect(check.status).toBe('gap');
    expect(check.missing).toBe(2);
    // Tracked sequence still advances past the gap.
    expect(v.peek('s')).toBe(8);
  });

  it('reports a gap informationally for monotonic streams', () => {
    const v = new SequenceValidator();
    v.classify('s', 5);
    expect(v.classify('s', 20).status).toBe('gap');
  });

  it('reset forgets a stream', () => {
    const v = new SequenceValidator();
    v.classify('s', 5);
    v.reset('s');
    expect(v.classify('s', 99).status).toBe('first');
  });
});

describe('DuplicateDetector', () => {
  it('detects an exact replay', () => {
    const d = new DuplicateDetector();
    expect(d.check('s', 1)).toBe(false);
    expect(d.check('s', 1)).toBe(true);
    expect(d.check('s', 2)).toBe(false);
  });

  it('catches an out-of-order replay below the high-water mark', () => {
    const d = new DuplicateDetector();
    d.check('s', 10);
    d.check('s', 11);
    expect(d.check('s', 10)).toBe(true);
  });

  it('bounds its memory and evicts the oldest', () => {
    const d = new DuplicateDetector(2);
    d.check('s', 1);
    d.check('s', 2);
    d.check('s', 3); // evicts 1
    expect(d.check('s', 1)).toBe(false); // 1 was forgotten
  });

  it('keeps streams independent', () => {
    const d = new DuplicateDetector();
    d.check('a', 1);
    expect(d.check('b', 1)).toBe(false);
  });
});
