/**
 * Query models + pure query application (search / filter / sort) for symbols and
 * datasets. Data-layer logic, not UI logic. Deterministic.
 */
import type {
  AssetClass,
  Dataset,
  DatasetStatus,
  MarketDataType,
  SymbolRecord,
} from '@platform/market-data-sdk';

export type SortDir = 'asc' | 'desc';

export interface SymbolQuery {
  readonly search?: string;
  readonly assetClass?: AssetClass | 'ALL';
  readonly exchangeId?: string | 'ALL';
}

export function applySymbolQuery(
  data: readonly SymbolRecord[],
  query: SymbolQuery,
): SymbolRecord[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const assetClass = query.assetClass ?? 'ALL';
  const exchangeId = query.exchangeId ?? 'ALL';

  return data
    .filter((symbol) => {
      if (assetClass !== 'ALL' && symbol.assetClass !== assetClass) return false;
      if (exchangeId !== 'ALL' && symbol.exchangeId !== exchangeId) return false;
      if (search) {
        const haystack =
          `${symbol.canonical} ${symbol.native} ${symbol.aliases.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => a.canonical.localeCompare(b.canonical));
}

export type DatasetSortField = 'name' | 'status' | 'updatedAt' | 'marketDataType';

export interface DatasetQuery {
  readonly search?: string;
  readonly marketDataType?: MarketDataType | 'ALL';
  readonly status?: DatasetStatus | 'ALL';
  readonly sortBy?: DatasetSortField;
  readonly sortDir?: SortDir;
}

export function applyDatasetQuery(data: readonly Dataset[], query: DatasetQuery): Dataset[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const marketDataType = query.marketDataType ?? 'ALL';
  const status = query.status ?? 'ALL';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((dataset) => {
    if (marketDataType !== 'ALL' && dataset.marketDataType !== marketDataType) return false;
    if (status !== 'ALL' && dataset.status !== status) return false;
    if (search && !dataset.name.toLowerCase().includes(search)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'marketDataType')
      comparison = a.marketDataType.localeCompare(b.marketDataType);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
