/**
 * Canonical timeframe vocabulary for time-series market data. Ordered by
 * duration; `tick` denotes event-level (non-bar) data.
 */
export type Timeframe = 'tick' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface TimeframeDescriptor {
  readonly timeframe: Timeframe;
  readonly label: string;
  /** Nominal duration in seconds; `tick` is 0 (event-level). */
  readonly seconds: number;
}

export const TIMEFRAMES: readonly Timeframe[] = ['tick', '1m', '5m', '15m', '1h', '4h', '1d', '1w'];

const DESCRIPTORS: Record<Timeframe, TimeframeDescriptor> = {
  tick: { timeframe: 'tick', label: 'Tick', seconds: 0 },
  '1m': { timeframe: '1m', label: '1 minute', seconds: 60 },
  '5m': { timeframe: '5m', label: '5 minutes', seconds: 300 },
  '15m': { timeframe: '15m', label: '15 minutes', seconds: 900 },
  '1h': { timeframe: '1h', label: '1 hour', seconds: 3_600 },
  '4h': { timeframe: '4h', label: '4 hours', seconds: 14_400 },
  '1d': { timeframe: '1d', label: '1 day', seconds: 86_400 },
  '1w': { timeframe: '1w', label: '1 week', seconds: 604_800 },
};

export function describeTimeframe(timeframe: Timeframe): TimeframeDescriptor {
  return DESCRIPTORS[timeframe];
}

export function timeframeSeconds(timeframe: Timeframe): number {
  return DESCRIPTORS[timeframe].seconds;
}

export function listTimeframes(): readonly TimeframeDescriptor[] {
  return TIMEFRAMES.map((timeframe) => DESCRIPTORS[timeframe]);
}
