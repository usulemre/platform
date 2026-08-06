import { create } from 'zustand';
import type { ConnectorStatusDto, ConnectorTypeDto } from '../domain/dto';
import type { ConnectorSortField, SortDir } from '../domain/query';

/** Client-side UI state for the Connector Registry list controls. UI state only
 *  (Zustand); connector data is server state (TanStack Query). */
interface ConnectorQueryState {
  readonly search: string;
  readonly type: ConnectorTypeDto | 'ALL';
  readonly status: ConnectorStatusDto | 'ALL';
  readonly sortBy: ConnectorSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setType: (type: ConnectorTypeDto | 'ALL') => void;
  readonly setStatus: (status: ConnectorStatusDto | 'ALL') => void;
  readonly setSort: (sortBy: ConnectorSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  type: 'ALL' as const,
  status: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const useConnectorQueryStore = create<ConnectorQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setType: (type) => set({ type }),
  setStatus: (status) => set({ status }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
  reset: () => set({ ...INITIAL }),
}));
