import { create } from 'zustand';
import type { AssetClass, DatasetStatus, MarketDataType } from '@platform/market-data-sdk';
import type { DatasetSortField } from '../domain/query';

/** UI state for the Symbol Registry list controls (Zustand; data is server state). */
interface SymbolQueryState {
  readonly search: string;
  readonly assetClass: AssetClass | 'ALL';
  readonly setSearch: (search: string) => void;
  readonly setAssetClass: (assetClass: AssetClass | 'ALL') => void;
}

export const useSymbolQueryStore = create<SymbolQueryState>((set) => ({
  search: '',
  assetClass: 'ALL',
  setSearch: (search) => set({ search }),
  setAssetClass: (assetClass) => set({ assetClass }),
}));

/** UI state for the Dataset Explorer list controls. */
interface DatasetQueryState {
  readonly search: string;
  readonly marketDataType: MarketDataType | 'ALL';
  readonly status: DatasetStatus | 'ALL';
  readonly sortBy: DatasetSortField;
  readonly sortDir: 'asc' | 'desc';
  readonly setSearch: (search: string) => void;
  readonly setMarketDataType: (marketDataType: MarketDataType | 'ALL') => void;
  readonly setStatus: (status: DatasetStatus | 'ALL') => void;
  readonly setSort: (sortBy: DatasetSortField) => void;
}

export const useDatasetQueryStore = create<DatasetQueryState>((set) => ({
  search: '',
  marketDataType: 'ALL',
  status: 'ALL',
  sortBy: 'updatedAt',
  sortDir: 'desc',
  setSearch: (search) => set({ search }),
  setMarketDataType: (marketDataType) => set({ marketDataType }),
  setStatus: (status) => set({ status }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
}));
