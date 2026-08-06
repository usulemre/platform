import type { Metadata } from 'next';
import { ActivityFeed } from '@/modules/workspace';

export const metadata: Metadata = {
  title: 'Activity · Research Platform',
};

/** Activity page — the read-only chronological feed of recent research events. */
export default function ActivityPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Recent activity</h1>
      <ActivityFeed />
    </div>
  );
}
