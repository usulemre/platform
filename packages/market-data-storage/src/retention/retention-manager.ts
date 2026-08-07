/**
 * The **retention manager** — configurable, explicit, observable lifecycle for stored partitions. It
 * classifies each partition as hot / historical / expired by age and, only when explicitly invoked,
 * drops the expired ones (whole-partition deletion, the reason partitioning is by date). Retention is
 * never destructive by default: with no `retentionDurationMs` configured, nothing ever expires, and
 * `plan` offers a non-destructive dry run before `apply` deletes anything (SC-2 lifecycle without the
 * "hot forever" anti-pattern; no hardcoded destructive behavior). `now` is passed in — no ambient clock.
 */
import type { MarketDataType } from '@platform/market-data-sdk';
import type { StorageEngine } from '../engine/storage-engine';
import type { StorageMetrics } from '../metrics/storage-metrics';
import { parsePartitionKey } from '../partition';

export type RetentionTier = 'hot' | 'historical' | 'expired';

export interface RetentionRule {
  /** Age (ms) beyond which a partition is no longer "hot" (still queryable). */
  readonly hotDurationMs?: number;
  /** Age (ms) beyond which a partition is expired and eligible for deletion. */
  readonly retentionDurationMs?: number;
}

export interface RetentionPolicy extends RetentionRule {
  /** Per-market-data-type overrides. */
  readonly byType?: Partial<Record<MarketDataType, RetentionRule>>;
}

export interface RetentionPlanItem {
  readonly partition: string;
  readonly tier: RetentionTier;
  readonly ageMs: number;
}

export interface RetentionReport {
  readonly dropped: readonly { readonly partition: string; readonly entries: number }[];
  readonly totalEntries: number;
}

const DAY_MS = 86_400_000;

export class StorageRetentionManager {
  constructor(
    private readonly engine: StorageEngine,
    private readonly policy: RetentionPolicy = {},
    private readonly metrics?: StorageMetrics,
  ) {}

  private ruleFor(type: MarketDataType | undefined): RetentionRule {
    const override = type ? this.policy.byType?.[type] : undefined;
    return {
      hotDurationMs: override?.hotDurationMs ?? this.policy.hotDurationMs,
      retentionDurationMs: override?.retentionDurationMs ?? this.policy.retentionDurationMs,
    };
  }

  /** The end-of-day epoch-ms for a partition's UTC date (pure function of the date string). */
  private partitionEndMs(date: string): number {
    const start = Date.parse(`${date}T00:00:00.000Z`);
    return start + DAY_MS - 1;
  }

  /** Classify a single partition by age. */
  classify(partition: string, now: number): RetentionPlanItem {
    const key = parsePartitionKey(partition);
    const ageMs = key ? now - this.partitionEndMs(key.date) : 0;
    const rule = this.ruleFor(key?.marketDataType);
    let tier: RetentionTier = 'hot';
    if (rule.retentionDurationMs !== undefined && ageMs > rule.retentionDurationMs) {
      tier = 'expired';
    } else if (rule.hotDurationMs !== undefined && ageMs > rule.hotDurationMs) {
      tier = 'historical';
    }
    return { partition, tier, ageMs };
  }

  /** A non-destructive plan of what `apply` would delete at `now`. */
  plan(now: number): readonly RetentionPlanItem[] {
    return this.engine
      .listPartitions()
      .map((partition) => this.classify(partition, now))
      .filter((item) => item.tier === 'expired');
  }

  /** Delete expired partitions. Explicit and observable; returns what was dropped. */
  async apply(now: number): Promise<RetentionReport> {
    const dropped: { partition: string; entries: number }[] = [];
    let totalEntries = 0;
    for (const item of this.plan(now)) {
      const entries = await this.engine.dropPartition(item.partition);
      dropped.push({ partition: item.partition, entries });
      totalEntries += entries;
      this.metrics?.onPartitionDropped(entries);
    }
    return { dropped, totalEntries };
  }
}
