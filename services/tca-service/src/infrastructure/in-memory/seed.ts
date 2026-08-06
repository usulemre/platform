/**
 * Deterministic seed executions for the tca-service (development/test only). Synthetic post-trade
 * records — fills, benchmark prices and explicit costs — NOT market data and NOT from any venue. NO
 * exchange/broker SDK, NO FIX, NO connectivity. The TCA analysis applied to this data is REAL (from
 * `@platform/tca-sdk`).
 */
import type { ExecutionInput, ExecutionMode, Side } from '@platform/tca-sdk';

interface SeedSpec {
  readonly id: string;
  readonly symbol: string;
  readonly side: Side;
  readonly venue: string;
  readonly mode: ExecutionMode;
  readonly orderQty: number;
  readonly arrival: number;
  readonly fills: readonly (readonly [qty: number, price: number])[];
  readonly drift: number; // signed post-trade mid move from arrival
  readonly spreadBps: number;
  readonly commissionPerShare: number;
  readonly marketVolume: number;
  readonly at: string;
}

function build(spec: SeedSpec): ExecutionInput {
  const executedQty = spec.fills.reduce((q, [fq]) => q + fq, 0);
  const commission = executedQty * spec.commissionPerShare;
  const mid =
    spec.arrival +
    (spec.side === 'BUY' ? spec.spreadBps / 2 / 10000 : -spec.spreadBps / 2 / 10000) * spec.arrival;
  const midAfter = spec.arrival + spec.drift;
  return {
    id: spec.id,
    orderId: spec.id.replace('TCA', 'ORD'),
    symbol: spec.symbol,
    side: spec.side,
    orderQuantity: spec.orderQty,
    fills: spec.fills.map(([quantity, price]) => ({
      quantity,
      price,
      at: spec.at,
      venue: spec.venue,
    })),
    benchmarks: {
      arrival: spec.arrival,
      decision: spec.arrival - spec.arrival * 0.0005,
      vwap: spec.arrival + spec.drift * 0.4,
      twap: spec.arrival + spec.drift * 0.5,
      open: spec.arrival - spec.arrival * 0.0003,
      close: spec.arrival + spec.drift,
      mid,
      last: spec.arrival + spec.drift * 1.1,
    },
    commission,
    spreadBps: spec.spreadBps,
    marketVolume: spec.marketVolume,
    midAfter,
    venue: spec.venue,
    mode: spec.mode,
    executedAt: spec.at,
  };
}

const SPECS: readonly SeedSpec[] = [
  {
    id: 'TCA-0001',
    symbol: 'AAPL',
    side: 'BUY',
    venue: 'XNAS',
    mode: 'LIVE',
    orderQty: 10_000,
    arrival: 190.0,
    fills: [
      [6000, 190.04],
      [4000, 190.11],
    ],
    drift: 0.06,
    spreadBps: 2.5,
    commissionPerShare: 0.004,
    marketVolume: 900_000,
    at: '2026-08-04T14:30:00.000Z',
  },
  {
    id: 'TCA-0002',
    symbol: 'AAPL',
    side: 'SELL',
    venue: 'ARCA',
    mode: 'LIVE',
    orderQty: 8_000,
    arrival: 191.2,
    fills: [[8000, 191.14]],
    drift: -0.05,
    spreadBps: 2.0,
    commissionPerShare: 0.003,
    marketVolume: 750_000,
    at: '2026-08-04T15:05:00.000Z',
  },
  {
    id: 'TCA-0003',
    symbol: 'MSFT',
    side: 'BUY',
    venue: 'XNAS',
    mode: 'LIVE',
    orderQty: 5_000,
    arrival: 430.5,
    fills: [
      [2500, 430.62],
      [2500, 430.78],
    ],
    drift: 0.22,
    spreadBps: 3.0,
    commissionPerShare: 0.005,
    marketVolume: 400_000,
    at: '2026-08-04T15:20:00.000Z',
  },
  {
    id: 'TCA-0004',
    symbol: 'MSFT',
    side: 'BUY',
    venue: 'BATS',
    mode: 'PAPER',
    orderQty: 4_000,
    arrival: 431.0,
    fills: [[4000, 430.9]],
    drift: -0.1,
    spreadBps: 2.8,
    commissionPerShare: 0.002,
    marketVolume: 350_000,
    at: '2026-08-04T15:35:00.000Z',
  },
  {
    id: 'TCA-0005',
    symbol: 'TSLA',
    side: 'BUY',
    venue: 'EDGX',
    mode: 'LIVE',
    orderQty: 12_000,
    arrival: 250.0,
    fills: [
      [5000, 250.18],
      [4000, 250.35],
      [3000, 250.52],
    ],
    drift: 0.45,
    spreadBps: 6.0,
    commissionPerShare: 0.006,
    marketVolume: 500_000,
    at: '2026-08-04T16:00:00.000Z',
  },
  {
    id: 'TCA-0006',
    symbol: 'TSLA',
    side: 'SELL',
    venue: 'ARCA',
    mode: 'LIVE',
    orderQty: 9_000,
    arrival: 252.4,
    fills: [
      [4500, 252.3],
      [4500, 252.12],
    ],
    drift: -0.4,
    spreadBps: 5.5,
    commissionPerShare: 0.006,
    marketVolume: 480_000,
    at: '2026-08-04T16:20:00.000Z',
  },
  {
    id: 'TCA-0007',
    symbol: 'NVDA',
    side: 'BUY',
    venue: 'XNAS',
    mode: 'LIVE',
    orderQty: 3_000,
    arrival: 120.5,
    fills: [
      [1500, 120.55],
      [1500, 120.61],
    ],
    drift: 0.09,
    spreadBps: 2.2,
    commissionPerShare: 0.003,
    marketVolume: 1_200_000,
    at: '2026-08-04T16:40:00.000Z',
  },
  {
    id: 'TCA-0008',
    symbol: 'NVDA',
    side: 'SELL',
    venue: 'IEX',
    mode: 'PAPER',
    orderQty: 6_000,
    arrival: 121.0,
    fills: [[6000, 121.03]],
    drift: 0.02,
    spreadBps: 1.8,
    commissionPerShare: 0.0,
    marketVolume: 1_000_000,
    at: '2026-08-04T17:00:00.000Z',
  },
  {
    id: 'TCA-0009',
    symbol: 'SPY',
    side: 'BUY',
    venue: 'ARCA',
    mode: 'LIVE',
    orderQty: 20_000,
    arrival: 545.0,
    fills: [
      [10000, 545.01],
      [10000, 545.03],
    ],
    drift: 0.04,
    spreadBps: 1.2,
    commissionPerShare: 0.002,
    marketVolume: 3_000_000,
    at: '2026-08-04T17:20:00.000Z',
  },
  {
    id: 'TCA-0010',
    symbol: 'SPY',
    side: 'SELL',
    venue: 'BATS',
    mode: 'LIVE',
    orderQty: 15_000,
    arrival: 546.2,
    fills: [
      [7500, 546.1],
      [7500, 545.9],
    ],
    drift: -0.25,
    spreadBps: 1.3,
    commissionPerShare: 0.002,
    marketVolume: 2_800_000,
    at: '2026-08-04T17:45:00.000Z',
  },
  {
    id: 'TCA-0011',
    symbol: 'AAPL',
    side: 'BUY',
    venue: 'IEX',
    mode: 'SIMULATED',
    orderQty: 7_000,
    arrival: 189.5,
    fills: [[7000, 189.44]],
    drift: -0.08,
    spreadBps: 2.4,
    commissionPerShare: 0.0,
    marketVolume: 820_000,
    at: '2026-08-04T18:00:00.000Z',
  },
  {
    id: 'TCA-0012',
    symbol: 'TSLA',
    side: 'BUY',
    venue: 'XNAS',
    mode: 'PAPER',
    orderQty: 10_000,
    arrival: 249.0,
    fills: [
      [4000, 249.4],
      [6000, 249.9],
    ],
    drift: 0.85,
    spreadBps: 6.5,
    commissionPerShare: 0.005,
    marketVolume: 450_000,
    at: '2026-08-04T18:20:00.000Z',
  },
];

export const EXECUTIONS: readonly ExecutionInput[] = SPECS.map(build);
