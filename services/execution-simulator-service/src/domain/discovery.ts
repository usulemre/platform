/**
 * Pure Execution Simulator discovery/search. Deterministic, no IO. Backs the registry
 * and session-explorer capabilities — no ranking model, no execution algorithm, no
 * fill/price calculation.
 */
import { sessionKey, type SimulationSession, type SimulationStage } from '@platform/execution-sdk';

export interface SessionSearch {
  readonly search?: string;
  readonly namespace?: string;
  readonly family?: string;
  readonly stage?: SimulationStage | 'ALL';
  readonly tag?: string;
}

export function searchSessions(
  sessions: readonly SimulationSession[],
  query: SessionSearch,
): SimulationSession[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const family = query.family ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';

  return sessions
    .filter((session) => {
      if (namespace !== 'ALL' && session.namespace !== namespace) return false;
      if (family !== 'ALL' && session.family !== family) return false;
      if (stage !== 'ALL' && session.stage !== stage) return false;
      if (tag && !session.tags.some((t) => t.toLowerCase() === tag)) return false;
      if (search) {
        const haystack =
          `${session.name} ${session.namespace} ${session.family} ${session.owner.owner} ${session.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve a session by its canonical `namespace/family/name` key. */
export function resolveByKey(
  sessions: readonly SimulationSession[],
  key: string,
): SimulationSession | null {
  const needle = key.trim().toLowerCase();
  return (
    sessions.find(
      (session) => sessionKey(session.namespace, session.family, session.name) === needle,
    ) ?? null
  );
}
