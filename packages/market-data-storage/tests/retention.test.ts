import { ManualClock } from '@platform/market-data-ingestion';
import { describe, expect, it } from 'vitest';
import { MarketDataStorage } from '../src/index';
import { DAY, INSTRUMENT, T0, trade } from './helpers';

describe('StorageRetentionManager', () => {
  it('does nothing by default (non-destructive)', async () => {
    const s = new MarketDataStorage({ clock: new ManualClock(T0) });
    await s.write(trade());
    const report = await s.applyRetention(T0 + 1000 * DAY);
    expect(report.dropped).toEqual([]);
    expect(s.size()).toBe(1);
  });

  it('plans (dry-run) and then applies expiration explicitly', async () => {
    const s = new MarketDataStorage({
      clock: new ManualClock(T0),
      retention: { retentionDurationMs: 30 * DAY },
    });
    await s.write(trade({ timestamps: { eventTime: T0, receiveTime: T0, processingTime: T0 } }));
    const now = T0 + 100 * DAY;

    const plan = s.planRetention(now);
    expect(plan).toHaveLength(1);
    expect(plan[0]?.tier).toBe('expired');
    // Plan is non-destructive.
    expect(s.size()).toBe(1);

    const report = await s.applyRetention(now);
    expect(report.totalEntries).toBe(1);
    expect(s.size()).toBe(0);
    expect(s.metricsSnapshot().partitionsDropped).toBe(1);
  });

  it('keeps recent data hot and does not expire it', async () => {
    const s = new MarketDataStorage({
      clock: new ManualClock(T0),
      retention: { hotDurationMs: 7 * DAY, retentionDurationMs: 30 * DAY },
    });
    await s.write(trade());
    const now = T0 + 2 * DAY; // within hot window
    expect(s.planRetention(now)).toEqual([]);
    const report = await s.applyRetention(now);
    expect(report.dropped).toEqual([]);
    expect(s.size()).toBe(1);
  });

  it('queries still work up until data is explicitly expired', async () => {
    const s = new MarketDataStorage({
      clock: new ManualClock(T0),
      retention: { retentionDurationMs: 30 * DAY },
    });
    await s.write(trade({ tradeId: 1 }));
    expect(await s.trades.byInstrument(INSTRUMENT)).toHaveLength(1);
    await s.applyRetention(T0 + 100 * DAY);
    expect(await s.trades.byInstrument(INSTRUMENT)).toHaveLength(0);
  });
});
