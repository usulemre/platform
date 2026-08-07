/**
 * `SyncMetrics` — deterministic counters for the account synchronizer (snapshots loaded, events
 * applied, events dropped by reason, reconciliations, recoveries) plus the last snapshot/event times.
 * It also composes the immutable {@link SyncStatus} view from the current lifecycle state. Timestamps
 * are supplied by the caller (injected clock upstream); pure accumulator.
 */
import type { SequenceDecision } from './sequence-validator';
import type { SynchronizationState, SyncStatus } from './canonical';

export interface SyncMetricsSnapshot {
  readonly snapshotsLoaded: number;
  readonly eventsApplied: number;
  readonly duplicates: number;
  readonly stale: number;
  readonly reconciliations: number;
  readonly recoveries: number;
  readonly lastSnapshotAt: number | undefined;
  readonly lastEventAt: number | undefined;
}

export class SyncMetrics {
  private snapshotsLoaded = 0;
  private eventsApplied = 0;
  private duplicates = 0;
  private stale = 0;
  private reconciliations = 0;
  private recoveries = 0;
  private lastSnapshotAt: number | undefined;
  private lastEventAt: number | undefined;

  onSnapshot(at: number): void {
    this.snapshotsLoaded += 1;
    this.lastSnapshotAt = at;
  }

  onEvent(decision: SequenceDecision, at: number): void {
    this.lastEventAt = at;
    if (decision === 'ok') this.eventsApplied += 1;
    else if (decision === 'duplicate') this.duplicates += 1;
    else this.stale += 1;
  }

  onReconcile(): void {
    this.reconciliations += 1;
  }

  onRecover(): void {
    this.recoveries += 1;
  }

  get droppedEvents(): number {
    return this.duplicates + this.stale;
  }

  snapshot(): SyncMetricsSnapshot {
    return {
      snapshotsLoaded: this.snapshotsLoaded,
      eventsApplied: this.eventsApplied,
      duplicates: this.duplicates,
      stale: this.stale,
      reconciliations: this.reconciliations,
      recoveries: this.recoveries,
      lastSnapshotAt: this.lastSnapshotAt,
      lastEventAt: this.lastEventAt,
    };
  }

  /** Compose the synchronization status for a lifecycle state. */
  status(state: SynchronizationState, degradedReason?: string): SyncStatus {
    return {
      state,
      lastSnapshotAt: this.lastSnapshotAt,
      lastEventAt: this.lastEventAt,
      appliedEvents: this.eventsApplied,
      droppedEvents: this.droppedEvents,
      recoveries: this.recoveries,
      degradedReason,
    };
  }
}
