import { bench, describe } from 'vitest';
import { aggregate, analyzeExecution, compareVenues, type ExecutionInput } from '../src/index';

/** Deterministic synthetic executions (mulberry32 PRNG — no Math.random, reproducible). */
function synthetic(n: number, seed = 0x9e3779b9): ExecutionInput[] {
  let state = seed >>> 0;
  const rand = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const venues = ['XNAS', 'ARCA', 'BATS', 'EDGX'];
  const inputs: ExecutionInput[] = [];
  for (let i = 0; i < n; i += 1) {
    const arrival = 100 + rand() * 20;
    const drift = (rand() - 0.5) * 0.4;
    const price = arrival + drift;
    const qty = 500 + Math.floor(rand() * 5000);
    inputs.push({
      id: `TCA-${i}`,
      orderId: `ORD-${i}`,
      symbol: 'SYN',
      side: rand() > 0.5 ? 'BUY' : 'SELL',
      orderQuantity: qty,
      fills: [
        {
          quantity: Math.floor(qty * 0.6),
          price: price - 0.01,
          at: '2026-08-01T15:00:00.000Z',
          venue: venues[i % venues.length]!,
        },
        {
          quantity: qty - Math.floor(qty * 0.6),
          price: price + 0.02,
          at: '2026-08-01T15:01:00.000Z',
          venue: venues[i % venues.length]!,
        },
      ],
      benchmarks: {
        arrival,
        decision: arrival - 0.05,
        vwap: arrival + 0.02,
        twap: arrival + 0.03,
        open: arrival - 0.02,
        close: arrival + drift,
        mid: arrival + 0.005,
        last: price + 0.03,
      },
      commission: qty * 0.001,
      spreadBps: 2 + rand() * 6,
      marketVolume: 100_000 + rand() * 900_000,
      midAfter: price + 0.01,
      venue: venues[i % venues.length]!,
      mode: 'PAPER',
      executedAt: '2026-08-01T15:01:00.000Z',
    });
  }
  return inputs;
}

const ONE = synthetic(1)[0]!;
const MANY = synthetic(10_000);
const ANALYZED = MANY.map(analyzeExecution);

describe('tca calculations', () => {
  bench('analyzeExecution (single)', () => {
    analyzeExecution(ONE);
  });
  bench('analyzeExecution x10000', () => {
    for (const input of MANY) analyzeExecution(input);
  });
  bench('compareVenues (10000 analyzed)', () => {
    compareVenues(ANALYZED);
  });
  bench('aggregate (10000 analyzed)', () => {
    aggregate(ANALYZED);
  });
});
