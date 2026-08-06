import { create } from 'zustand';
import type { DeploymentStage } from '@platform/trading-sdk';
import type { DeploymentSortField, SortDir } from '../domain/query';

/** UI state for the deployment registry list controls (Zustand; data is server state). */
interface DeploymentQueryState {
  readonly search: string;
  readonly namespace: string | 'ALL';
  readonly stage: DeploymentStage | 'ALL';
  readonly sortBy: DeploymentSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setNamespace: (namespace: string | 'ALL') => void;
  readonly setStage: (stage: DeploymentStage | 'ALL') => void;
  readonly setSort: (sortBy: DeploymentSortField) => void;
}

export const useDeploymentQueryStore = create<DeploymentQueryState>((set) => ({
  search: '',
  namespace: 'ALL',
  stage: 'ALL',
  sortBy: 'name',
  sortDir: 'asc',
  setSearch: (search) => set({ search }),
  setNamespace: (namespace) => set({ namespace }),
  setStage: (stage) => set({ stage }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
}));
