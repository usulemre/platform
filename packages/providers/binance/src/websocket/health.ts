/**
 * `MarketDataHealthMonitor` — deterministic health for the market-data connection. It projects the
 * connection state, message recency (liveness) and gap activity onto a canonical health level. The
 * clock is INJECTED and the last-message time is recorded as messages arrive, so health is a pure
 * function of observed inputs. This monitor DECIDES nothing about trading — it only reports liveness.
 */
export type MarketDataHealthLevel = 'HEALTHY' | 'DEGRADED' | 'STALE' | 'DISCONNECTED';

export interface MarketDataHealth {
  readonly level: MarketDataHealthLevel;
  readonly connected: boolean;
  readonly lastMessageAgeMs: number;
  readonly gaps: number;
  readonly activeStreams: number;
  readonly evaluatedAt: number;
}

export interface MarketDataHealthMonitorDeps {
  readonly clock: () => number;
  /** Age (ms) beyond which a live connection with no messages is considered STALE. */
  readonly stalenessMs: number;
}

export class MarketDataHealthMonitor {
  private lastMessageAt: number | undefined;
  private lastGaps = 0;
  private readonly clock: () => number;
  private readonly stalenessMs: number;

  constructor(deps: MarketDataHealthMonitorDeps) {
    this.clock = deps.clock;
    this.stalenessMs = deps.stalenessMs;
  }

  /** Record that a message arrived (liveness signal). */
  recordMessage(): void {
    this.lastMessageAt = this.clock();
  }

  /** The age of the last observed message (Infinity when none yet). */
  lastMessageAgeMs(): number {
    return this.lastMessageAt === undefined
      ? Number.POSITIVE_INFINITY
      : this.clock() - this.lastMessageAt;
  }

  /** Whether the connection appears live (a message seen within the staleness window). */
  isLive(): boolean {
    return this.lastMessageAgeMs() <= this.stalenessMs;
  }

  /** Compute the current health from the connection state, message recency and gap count. */
  evaluate(connected: boolean, activeStreams: number, gaps: number): MarketDataHealth {
    const at = this.clock();
    const ageMs = this.lastMessageAgeMs();
    let level: MarketDataHealthLevel;
    if (!connected) level = 'DISCONNECTED';
    else if (activeStreams > 0 && ageMs > this.stalenessMs) level = 'STALE';
    else if (gaps > this.lastGaps) level = 'DEGRADED';
    else level = 'HEALTHY';
    this.lastGaps = gaps;
    return {
      level,
      connected,
      lastMessageAgeMs: ageMs === Number.POSITIVE_INFINITY ? -1 : ageMs,
      gaps,
      activeStreams,
      evaluatedAt: at,
    };
  }
}
