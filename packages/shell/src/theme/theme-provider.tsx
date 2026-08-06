'use client';

import { useEffect, type ReactNode } from 'react';
import { useThemeStore, type Theme } from './theme-store';

const STORAGE_KEY = 'platform-theme';

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  return theme;
}

/** Applies the current theme to <html> and persists the preference. No external
 *  theming library; theme state lives in Zustand (UI state only). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setTheme(stored);
    }
  }, [setTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark');
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return <>{children}</>;
}
