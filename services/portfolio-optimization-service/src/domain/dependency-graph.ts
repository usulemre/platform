/**
 * The optimizer dependency graph — conceptual dependencies between methods (e.g. target volatility
 * scales a maximum-Sharpe base; cash allocation builds on risk parity; rebalancing moves toward an
 * equal-weight target). Executors are self-contained, so the graph does not change any result; it
 * drives the execution SCHEDULER (dependencies run first) and the dependency visualization. Pure,
 * deterministic; detects cycles defensively.
 */
import type { OptimizerKey } from '@platform/portfolio-optimization-sdk';
import type { DependencyNode } from './models';

/** Declared conceptual dependencies. Keys not present have no dependencies. */
const OPTIMIZER_DEPENDENCIES: Partial<Record<OptimizerKey, readonly OptimizerKey[]>> = {
  target_volatility: ['maximum_sharpe'],
  cash_allocation: ['risk_parity'],
  portfolio_rebalancing: ['equal_weight'],
};

/** The direct dependencies of an optimizer. */
export function dependenciesOf(optimizerKey: OptimizerKey): readonly OptimizerKey[] {
  return OPTIMIZER_DEPENDENCIES[optimizerKey] ?? [];
}

/** All transitive dependencies of an optimizer (deduplicated). */
export function transitiveDependencies(optimizerKey: OptimizerKey): OptimizerKey[] {
  const seen = new Set<OptimizerKey>();
  const visit = (key: OptimizerKey): void => {
    for (const dep of dependenciesOf(key)) {
      if (!seen.has(dep)) {
        seen.add(dep);
        visit(dep);
      }
    }
  };
  visit(optimizerKey);
  return [...seen];
}

/**
 * Topologically sort the requested optimizers so every dependency that is also requested precedes
 * its dependents (Kahn's algorithm over the induced sub-graph). Throws on a cycle.
 */
export function topoSort(keys: readonly OptimizerKey[]): OptimizerKey[] {
  const set = new Set(keys);
  const indegree = new Map<OptimizerKey, number>();
  const dependents = new Map<OptimizerKey, OptimizerKey[]>();
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
  const order: OptimizerKey[] = [];
  while (queue.length > 0) {
    const key = queue.shift()!;
    order.push(key);
    for (const dependent of (dependents.get(key) ?? []).sort()) {
      const remaining = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, remaining);
      if (remaining === 0) queue.push(dependent);
    }
  }
  if (order.length !== set.size) throw new Error('optimizer dependency graph contains a cycle');
  return order;
}

/** Whether the induced sub-graph of `keys` is acyclic. */
export function isAcyclic(keys: readonly OptimizerKey[]): boolean {
  try {
    topoSort(keys);
    return true;
  } catch {
    return false;
  }
}

/** Group the requested optimizers into execution LEVELS (level 0 has no requested dependencies). */
export function scheduleLevels(keys: readonly OptimizerKey[]): OptimizerKey[][] {
  const set = new Set(keys);
  const order = topoSort(keys);
  const level = new Map<OptimizerKey, number>();
  for (const key of order) {
    let lvl = 0;
    for (const dep of dependenciesOf(key)) {
      if (set.has(dep)) lvl = Math.max(lvl, (level.get(dep) ?? 0) + 1);
    }
    level.set(key, lvl);
  }
  const levels: OptimizerKey[][] = [];
  for (const key of order) {
    const lvl = level.get(key)!;
    (levels[lvl] ??= []).push(key);
  }
  return levels;
}

/** Build dependency nodes (with levels) for the requested optimizers — for visualization. */
export function buildGraph(keys: readonly OptimizerKey[]): DependencyNode[] {
  const levels = scheduleLevels(keys);
  const levelOf = new Map<OptimizerKey, number>();
  levels.forEach((group, index) => group.forEach((key) => levelOf.set(key, index)));
  const requested = new Set(keys);
  return topoSort(keys).map((optimizerKey) => ({
    optimizerKey,
    dependsOn: dependenciesOf(optimizerKey).filter((dep) => requested.has(dep)),
    level: levelOf.get(optimizerKey) ?? 0,
  }));
}
