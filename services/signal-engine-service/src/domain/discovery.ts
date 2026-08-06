/**
 * Pure Signal Engine discovery/search. Deterministic, no IO. Backs the Signal
 * Discovery, Signal Search and Signal Catalog capabilities — no ranking model,
 * no alpha model, no statistics.
 */
import { signalKey, type RegisteredSignal, type SignalStage } from '@platform/signal-sdk';

export interface SignalSearch {
  readonly search?: string;
  readonly namespace?: string;
  readonly family?: string;
  readonly stage?: SignalStage | 'ALL';
  readonly tag?: string;
}

export function searchSignals(
  signals: readonly RegisteredSignal[],
  query: SignalSearch,
): RegisteredSignal[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const family = query.family ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';

  return signals
    .filter((signal) => {
      if (namespace !== 'ALL' && signal.namespace !== namespace) return false;
      if (family !== 'ALL' && signal.family !== family) return false;
      if (stage !== 'ALL' && signal.stage !== stage) return false;
      if (tag && !signal.tags.some((t) => t.toLowerCase() === tag)) return false;
      if (search) {
        const haystack =
          `${signal.name} ${signal.namespace} ${signal.family} ${signal.owner.owner} ${signal.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve a signal by its canonical `namespace/family/name` key. */
export function resolveByKey(
  signals: readonly RegisteredSignal[],
  key: string,
): RegisteredSignal | null {
  const needle = key.trim().toLowerCase();
  return (
    signals.find((signal) => signalKey(signal.namespace, signal.family, signal.name) === needle) ??
    null
  );
}
