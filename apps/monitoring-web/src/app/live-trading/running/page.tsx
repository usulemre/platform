import type { Metadata } from 'next';
import { RunningStrategies } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Running strategies · Monitoring' };

/** Running Strategies page. */
export default function RunningStrategiesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Running strategies</h1>
      <RunningStrategies />
    </div>
  );
}
