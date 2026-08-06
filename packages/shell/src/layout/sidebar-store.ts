import { create } from 'zustand';

interface SidebarState {
  readonly mobileOpen: boolean;
  readonly setMobileOpen: (open: boolean) => void;
}

/** Client-side UI state for the responsive sidebar drawer. */
export const useSidebarStore = create<SidebarState>((set) => ({
  mobileOpen: false,
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
}));
