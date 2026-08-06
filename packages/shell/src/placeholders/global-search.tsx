'use client';

import { Search } from 'lucide-react';

export interface GlobalSearchProps {
  onOpen?: () => void;
}

/** Placeholder global search entry point; opens the command palette for now.
 *  Real cross-module search arrives in a later phase. */
export function GlobalSearch({ onOpen }: GlobalSearchProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Search"
      className="hidden items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent sm:flex"
    >
      <Search className="h-4 w-4" />
      <span>Search…</span>
      <kbd className="rounded bg-muted px-1 text-xs">⌘K</kbd>
    </button>
  );
}
