import type { Metadata } from 'next';
import { Bookmarks } from '@/modules/workspace';

export const metadata: Metadata = {
  title: 'Bookmarks · Research Platform',
};

/** Bookmarks page — cross-module references saved for later. */
export default function BookmarksPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Bookmarks</h1>
      <Bookmarks />
    </div>
  );
}
