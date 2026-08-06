/**
 * @platform/auth · store — Zustand store for CLIENT-SIDE UI STATE ONLY.
 *
 * Per the Phase 4.1 quality bar, Zustand holds ephemeral UI state only. Session
 * and identity truth are SERVER state (TanStack Query) and are never mirrored
 * here. This store just remembers the path the user was heading to before being
 * bounced to the login screen, so we can return them afterwards.
 */
import { create } from 'zustand';

interface AuthUiState {
  readonly intendedPath: string | null;
  readonly setIntendedPath: (path: string | null) => void;
  readonly clearIntendedPath: () => void;
}

export const useAuthUiStore = create<AuthUiState>((set) => ({
  intendedPath: null,
  setIntendedPath: (path) => set({ intendedPath: path }),
  clearIntendedPath: () => set({ intendedPath: null }),
}));
