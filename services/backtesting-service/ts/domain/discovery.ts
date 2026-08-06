/**
 * Pure Backtesting Engine discovery/search. Deterministic, no IO. Backs the
 * catalog and registry-explorer capabilities — no ranking model, no simulation,
 * no metric computation.
 */
import {
  backtestKey,
  type Backtest,
  type BacktestStage,
  type ScenarioKind,
} from '@platform/backtesting-sdk';

export interface BacktestSearch {
  readonly search?: string;
  readonly namespace?: string;
  readonly family?: string;
  readonly stage?: BacktestStage | 'ALL';
  readonly scenario?: ScenarioKind | 'ALL';
  readonly tag?: string;
}

export function searchBacktests(backtests: readonly Backtest[], query: BacktestSearch): Backtest[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const family = query.family ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const scenario = query.scenario ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';

  return backtests
    .filter((backtest) => {
      if (namespace !== 'ALL' && backtest.namespace !== namespace) return false;
      if (family !== 'ALL' && backtest.family !== family) return false;
      if (stage !== 'ALL' && backtest.stage !== stage) return false;
      if (scenario !== 'ALL' && backtest.configuration.scenario.kind !== scenario) return false;
      if (tag && !backtest.tags.some((t) => t.toLowerCase() === tag)) return false;
      if (search) {
        const haystack =
          `${backtest.name} ${backtest.namespace} ${backtest.family} ${backtest.owner.owner} ${backtest.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve a backtest by its canonical `namespace/family/name` key. */
export function resolveByKey(backtests: readonly Backtest[], key: string): Backtest | null {
  const needle = key.trim().toLowerCase();
  return (
    backtests.find(
      (backtest) => backtestKey(backtest.namespace, backtest.family, backtest.name) === needle,
    ) ?? null
  );
}
