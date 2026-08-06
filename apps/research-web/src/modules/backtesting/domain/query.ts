/**
 * Backtest query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic — mirrors the service's pure
 * discovery/search so both tiers behave identically.
 */
import type { Backtest, BacktestStage, ScenarioKind } from '@platform/backtesting-sdk';

export type BacktestSortField = 'name' | 'family' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export interface BacktestQuery {
  readonly search?: string;
  readonly namespace?: string | 'ALL';
  readonly stage?: BacktestStage | 'ALL';
  readonly scenario?: ScenarioKind | 'ALL';
  readonly tag?: string;
  readonly sortBy?: BacktestSortField;
  readonly sortDir?: SortDir;
}

export function applyBacktestQuery(data: readonly Backtest[], query: BacktestQuery): Backtest[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const scenario = query.scenario ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir ?? 'asc';

  const filtered = data.filter((backtest) => {
    if (namespace !== 'ALL' && backtest.namespace !== namespace) return false;
    if (stage !== 'ALL' && backtest.stage !== stage) return false;
    if (scenario !== 'ALL' && backtest.configuration.scenario.kind !== scenario) return false;
    if (tag && !backtest.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (search) {
      const haystack =
        `${backtest.name} ${backtest.namespace} ${backtest.family} ${backtest.owner.owner} ${backtest.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'family')
      comparison = `${a.namespace}/${a.family}`.localeCompare(`${b.namespace}/${b.family}`);
    else if (sortBy === 'updatedAt') comparison = a.updatedAt.localeCompare(b.updatedAt);
    else comparison = a.name.localeCompare(b.name);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
