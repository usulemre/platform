import { create } from 'zustand';
import type { AgentAuthorityDto, AgentStatusDto } from '../domain/dto';
import type { AgentSortField, SortDir } from '../domain/query';

/** Client-side UI state for the registered-agents list controls. UI state only
 *  (Zustand); agent data is server state (TanStack Query). */
interface AgentQueryState {
  readonly search: string;
  readonly status: AgentStatusDto | 'ALL';
  readonly authority: AgentAuthorityDto | 'ALL';
  readonly sortBy: AgentSortField;
  readonly sortDir: SortDir;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: AgentStatusDto | 'ALL') => void;
  readonly setAuthority: (authority: AgentAuthorityDto | 'ALL') => void;
  readonly setSort: (sortBy: AgentSortField) => void;
  readonly reset: () => void;
}

const INITIAL = {
  search: '',
  status: 'ALL' as const,
  authority: 'ALL' as const,
  sortBy: 'updatedAt' as const,
  sortDir: 'desc' as const,
};

export const useAgentQueryStore = create<AgentQueryState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setAuthority: (authority) => set({ authority }),
  setSort: (sortBy) =>
    set((state) =>
      state.sortBy === sortBy
        ? { sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortBy, sortDir: 'asc' },
    ),
  reset: () => set({ ...INITIAL }),
}));
