/**
 * The signal dependency graph. Two kinds of dependency exist:
 *
 *  - **signal → signal** (this graph): composite signals depend on the base signals they combine
 *    (e.g. the weighted aggregate depends on the MA-crossover, MACD-crossover and RSI-threshold
 *    signals; the rule-engine composite on the MA-crossover, trend filter and volume confirmation).
 *  - **signal → feature** (`featureDependenciesOf`): every signal consumes one or more feature
 *    calculations from the Feature Calculation Engine (cross-engine lineage → Feature Store).
 *
 * Executors are self-contained, so the graph does not change any result; it drives the execution
 * SCHEDULER (dependencies run first) and the researcher-facing dependency visualization. Pure,
 * deterministic; detects cycles defensively.
 */
import { describeSignal, type FeatureKey, type SignalKey } from '@platform/signal-calculation-sdk';
import type { DependencyNode } from './models';

/** Declared conceptual signal→signal dependencies. Keys not present have no signal dependencies. */
const SIGNAL_DEPENDENCIES: Partial<Record<SignalKey, readonly SignalKey[]>> = {
  composite: ['ma_crossover', 'trend_filter', 'volume_confirmation'],
  weighted_aggregate: ['ma_crossover', 'macd_crossover', 'rsi_threshold'],
  confidence: ['ma_crossover', 'macd_crossover', 'rsi_threshold'],
};

/** The direct signal dependencies of a signal. */
export function dependenciesOf(signalKey: SignalKey): readonly SignalKey[] {
  return SIGNAL_DEPENDENCIES[signalKey] ?? [];
}

/** The feature calculations a signal consumes (from the catalog descriptor). */
export function featureDependenciesOf(signalKey: SignalKey): readonly FeatureKey[] {
  return describeSignal(signalKey)?.features ?? [];
}

/** All transitive signal dependencies of a signal (deduplicated). */
export function transitiveDependencies(signalKey: SignalKey): SignalKey[] {
  const seen = new Set<SignalKey>();
  const visit = (key: SignalKey): void => {
    for (const dep of dependenciesOf(key)) {
      if (!seen.has(dep)) {
        seen.add(dep);
        visit(dep);
      }
    }
  };
  visit(signalKey);
  return [...seen];
}

/**
 * Topologically sort the requested signals so every dependency that is also requested precedes its
 * dependents. Uses Kahn's algorithm over the sub-graph induced by `keys`. Throws on a cycle (the
 * declared graph is a DAG; this guards against future edits).
 */
export function topoSort(keys: readonly SignalKey[]): SignalKey[] {
  const set = new Set(keys);
  const indegree = new Map<SignalKey, number>();
  const dependents = new Map<SignalKey, SignalKey[]>();
  for (const key of set) indegree.set(key, 0);
  for (const key of set) {
    for (const dep of dependenciesOf(key)) {
      if (!set.has(dep)) continue;
      indegree.set(key, (indegree.get(key) ?? 0) + 1);
      const list = dependents.get(dep) ?? [];
      list.push(key);
      dependents.set(dep, list);
    }
  }
  const queue = [...set].filter((key) => (indegree.get(key) ?? 0) === 0).sort();
  const order: SignalKey[] = [];
  while (queue.length > 0) {
    const key = queue.shift()!;
    order.push(key);
    for (const dependent of (dependents.get(key) ?? []).sort()) {
      const remaining = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, remaining);
      if (remaining === 0) queue.push(dependent);
    }
  }
  if (order.length !== set.size) throw new Error('signal dependency graph contains a cycle');
  return order;
}

/** Whether the induced sub-graph of `keys` is acyclic. */
export function isAcyclic(keys: readonly SignalKey[]): boolean {
  try {
    topoSort(keys);
    return true;
  } catch {
    return false;
  }
}

/**
 * Group the requested signals into execution LEVELS: level 0 has no requested dependencies, level
 * `n` depends only on levels `< n`. Signals in the same level can run concurrently.
 */
export function scheduleLevels(keys: readonly SignalKey[]): SignalKey[][] {
  const set = new Set(keys);
  const order = topoSort(keys);
  const level = new Map<SignalKey, number>();
  for (const key of order) {
    let lvl = 0;
    for (const dep of dependenciesOf(key)) {
      if (set.has(dep)) lvl = Math.max(lvl, (level.get(dep) ?? 0) + 1);
    }
    level.set(key, lvl);
  }
  const levels: SignalKey[][] = [];
  for (const key of order) {
    const lvl = level.get(key)!;
    (levels[lvl] ??= []).push(key);
  }
  return levels;
}

/** Build dependency nodes (with levels) for the requested signals — for visualization. */
export function buildGraph(keys: readonly SignalKey[]): DependencyNode[] {
  const levels = scheduleLevels(keys);
  const levelOf = new Map<SignalKey, number>();
  levels.forEach((group, index) => group.forEach((key) => levelOf.set(key, index)));
  const requested = new Set(keys);
  return topoSort(keys).map((signalKey) => ({
    signalKey,
    dependsOn: dependenciesOf(signalKey).filter((dep) => requested.has(dep)),
    level: levelOf.get(signalKey) ?? 0,
  }));
}
