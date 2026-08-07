/**
 * **Deterministic record identity & idempotency policy.**
 *
 * Storage must be safe against duplicate ingestion, so every canonical record maps to a stable,
 * content-derived identity built *only* from fields present in the canonical model (no invented ids).
 * Two writes with the same identity are the same event; the {@link IdempotencyPolicy} decides whether
 * a repeat is skipped (immutable events) or upserts (a candlestick bar whose later update supersedes
 * the earlier one). Identity is provider-independent — it never uses a venue-specific field.
 *
 * The **primary timestamp** is the single time axis used for partitioning and time-range queries: the
 * event time when known, else the exchange time, else the (always-present) receive time.
 */
import type {
  CanonicalTimestamps,
  MarketDataEventKind,
  NormalizedMarketDataRecord,
} from '@platform/market-data-ingestion';

/** How a repeated identity is handled by the engine. */
export type IdempotencyPolicy = 'skip' | 'upsert';

/** The canonical time axis a record is stored and queried on. */
export function primaryTimestamp(timestamps: CanonicalTimestamps): number {
  return timestamps.eventTime ?? timestamps.exchangeTime ?? timestamps.receiveTime;
}

/**
 * A deterministic identity for a canonical record. Immutable events use their venue-neutral exchange
 * id / sequence; stateless snapshots (ticker/mark/avg price) use the instrument + kind + event time,
 * which is the only natural key the canonical model offers for them.
 */
export function recordIdentity(record: NormalizedMarketDataRecord): string {
  const inst = record.instrumentId;
  switch (record.kind) {
    case 'trade':
      return `t|${inst}|${record.tradeId}`;
    case 'aggTrade':
      return `a|${inst}|${record.aggregateTradeId}`;
    case 'bookTicker':
      return `b|${inst}|${record.updateId}`;
    case 'orderBookSnapshot':
      return `obs|${inst}|${record.lastUpdateId}`;
    case 'orderBookDelta':
      return `obd|${inst}|${record.firstUpdateId}-${record.finalUpdateId}`;
    case 'candlestick':
      return `k|${inst}|${record.interval}|${record.openTime}`;
    case 'ticker':
      return `tk|${inst}|${primaryTimestamp(record.timestamps)}`;
    case 'markPrice':
      return `mp|${inst}|${primaryTimestamp(record.timestamps)}`;
    case 'avgPrice':
      return `ap|${inst}|${primaryTimestamp(record.timestamps)}`;
  }
}

/**
 * The idempotency policy for a kind. A candlestick's `openTime` identifies a *bar*, and a later
 * update to that bar is newer truth, so it upserts. Every other kind is an immutable observation: a
 * repeat is a duplicate and is skipped (first write wins), which keeps duplicate ingestion from
 * corrupting stored data.
 */
export function idempotencyPolicy(kind: MarketDataEventKind): IdempotencyPolicy {
  return kind === 'candlestick' ? 'upsert' : 'skip';
}
