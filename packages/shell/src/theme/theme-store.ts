import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  readonly theme: Theme;
  readonly setTheme: (theme: Theme) => void;
}

/** Theme is client-side UI state (Zustand). Persistence/DOM application is
 *  handled by the ThemeProvider. */
export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}));
