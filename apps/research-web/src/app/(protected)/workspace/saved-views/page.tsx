import type { Metadata } from 'next';
import { SavedViews } from '@/modules/workspace';

export const metadata: Metadata = {
  title: 'Saved views · Research Platform',
};

/** Saved views page — named, reusable filters that deep-link into module lists. */
export default function SavedViewsPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Saved views</h1>
      <SavedViews />
    </div>
  );
}
