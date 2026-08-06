/**
 * Pure Execution Simulator domain derivations. Deterministic, no IO, no execution
 * algorithm, no fill/price calculation. These back the queue, history, versioning and
 * comparison-assembly capabilities. Metric VALUES are passed through unchanged — never
 * calculated.
 */
import {
  compareVersions,
  isActiveRun,
  type MetricKey,
  type SimulationComparison,
  type SimulationSession,
  type ExecutionVersion,
} from '@platform/execution-sdk';

/** The current recommended version — newest by semantic order. */
export function currentVersion(session: SimulationSession): ExecutionVersion | null {
  return session.versions.reduce<ExecutionVersion | null>((best, candidate) => {
    if (!best) return candidate;
    return compareVersions(candidate.version, best.version) > 0 ? candidate : best;
  }, null);
}

/** Sessions with an active run (queued / running / paused) — the execution queue. */
export function executionQueue(sessions: readonly SimulationSession[]): SimulationSession[] {
  return sessions.filter((session) => isActiveRun(session.run.status));
}

/** Sessions awaiting a governance approval decision. */
export function approvalQueue(sessions: readonly SimulationSession[]): SimulationSession[] {
  return sessions.filter((session) =>
    session.approvals.some((approval) => approval.status === 'PENDING'),
  );
}

/** Sessions in a review stage — the review queue. */
export function reviewQueue(sessions: readonly SimulationSession[]): SimulationSession[] {
  return sessions.filter(
    (session) => session.stage === 'REVIEW' || session.reviews.some((r) => r.status === 'PENDING'),
  );
}

/** Completed / archived sessions — the simulation history. */
export function history(sessions: readonly SimulationSession[]): SimulationSession[] {
  return sessions.filter(
    (session) => session.run.status === 'COMPLETED' || session.stage === 'ARCHIVED',
  );
}

export interface ComparisonRow {
  readonly sessionId: string;
  readonly sessionName: string;
  readonly values: Readonly<Record<string, string>>;
}

export interface AssembledComparison {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly metricKeys: readonly MetricKey[];
  readonly rows: readonly ComparisonRow[];
}

/**
 * Assemble a comparison table by pulling each session's supplied metric values. PURE
 * lookup + reshape — NO metric is computed, ranked or scored here.
 */
export function assembleComparison(
  comparison: SimulationComparison,
  sessions: readonly SimulationSession[],
): AssembledComparison {
  const byId = new Map(sessions.map((session) => [session.id, session]));
  const rows: ComparisonRow[] = comparison.sessionIds.map((sessionId) => {
    const session = byId.get(sessionId);
    const metricValues = new Map(
      (session?.metrics ?? []).map((metric) => [metric.key, metric.value]),
    );
    const values: Record<string, string> = {};
    for (const key of comparison.metricKeys) values[key] = metricValues.get(key) ?? '—';
    return { sessionId, sessionName: session?.name ?? sessionId, values };
  });
  return {
    id: comparison.id,
    name: comparison.name,
    note: comparison.note,
    metricKeys: comparison.metricKeys,
    rows,
  };
}
