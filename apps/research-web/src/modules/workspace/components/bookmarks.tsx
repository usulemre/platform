'use client';

import { useBookmarks } from '../hooks/use-workspace';
import { InfoCard, ItemList } from './workspace-atoms';

/** Bookmarks — cross-module references the researcher saved for later. */
export function Bookmarks() {
  const query = useBookmarks();
  return (
    <InfoCard title="Bookmarks">
      <ItemList query={query} emptyLabel="No bookmarks yet." />
    </InfoCard>
  );
}
