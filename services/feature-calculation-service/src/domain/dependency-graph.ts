/**
 * The feature dependency graph — the conceptual computation dependencies between features (e.g.
 * z-score depends on the rolling mean and std; MACD on the EMA; Bollinger Bands on the SMA and
 * std; ATR on the true range). Executors are self-contained, so the graph does not change any
 * result; it drives the execution SCHEDULER (dependencies run first) and the researcher-facing
 * dependency visualization. Pure, deterministic; detects cycles defensively.
 */
import type { FeatureKey } from '@platform/feature-calculation-sdk';
import type { DependencyNode } from './models';

/** Declared conceptual dependencies. Keys not present have no dependencies. */
const FEATURE_DEPENDENCIES: Partial<Record<FeatureKey, readonly FeatureKey[]>> = {
  rolling_std: ['rolling_variance'],
  zscore: ['rolling_mean', 'rolling_std'],
  bollinger_bands: ['sma', 'rolling_std'],
  macd: ['ema'],
  atr: ['true_range'],
};

/** The direct dependencies of a feature. */
export function dependenciesOf(featureKey: FeatureKey): readonly FeatureKey[] {
  return FEATURE_DEPENDENCIES[featureKey] ?? [];
}

/** All transitive dependencies of a feature (deduplicated). */
export function transitiveDependencies(featureKey: FeatureKey): FeatureKey[] {
  const seen = new Set<FeatureKey>();
  const visit = (key: FeatureKey): void => {
    for (const dep of dependenciesOf(key)) {
      if (!seen.has(dep)) {
        seen.add(dep);
        visit(dep);
      }
    }
  };
  visit(featureKey);
  return [...seen];
}

/**
 * Topologically sort the requested features so every dependency that is also requested precedes
 * its dependents. Uses Kahn's algorithm over the sub-graph induced by `keys`. Throws on a cycle
 * (the declared graph is a DAG; this guards against future edits).
 */
export function topoSort(keys: readonly FeatureKey[]): FeatureKey[] {
  const set = new Set(keys);
  const indegree = new Map<FeatureKey, number>();
  const dependents = new Map<FeatureKey, FeatureKey[]>();
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
  const order: FeatureKey[] = [];
  while (queue.length > 0) {
    const key = queue.shift()!;
    order.push(key);
    for (const dependent of (dependents.get(key) ?? []).sort()) {
      const remaining = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, remaining);
      if (remaining === 0) queue.push(dependent);
    }
  }
  if (order.length !== set.size) throw new Error('feature dependency graph contains a cycle');
  return order;
}

/** Whether the induced sub-graph of `keys` is acyclic. */
export function isAcyclic(keys: readonly FeatureKey[]): boolean {
  try {
    topoSort(keys);
    return true;
  } catch {
    return false;
  }
}

/**
 * Group the requested features into execution LEVELS: level 0 has no requested dependencies,
 * level `n` depends only on levels `< n`. Features in the same level can run concurrently.
 */
export function scheduleLevels(keys: readonly FeatureKey[]): FeatureKey[][] {
  const set = new Set(keys);
  const order = topoSort(keys);
  const level = new Map<FeatureKey, number>();
  for (const key of order) {
    let lvl = 0;
    for (const dep of dependenciesOf(key)) {
      if (set.has(dep)) lvl = Math.max(lvl, (level.get(dep) ?? 0) + 1);
    }
    level.set(key, lvl);
  }
  const levels: FeatureKey[][] = [];
  for (const key of order) {
    const lvl = level.get(key)!;
    (levels[lvl] ??= []).push(key);
  }
  return levels;
}

/** Build dependency nodes (with levels) for the requested features — for visualization. */
export function buildGraph(keys: readonly FeatureKey[]): DependencyNode[] {
  const levels = scheduleLevels(keys);
  const levelOf = new Map<FeatureKey, number>();
  levels.forEach((group, index) => group.forEach((key) => levelOf.set(key, index)));
  return topoSort(keys).map((featureKey) => ({
    featureKey,
    dependsOn: dependenciesOf(featureKey).filter((dep) => new Set(keys).has(dep)),
    level: levelOf.get(featureKey) ?? 0,
  }));
}
