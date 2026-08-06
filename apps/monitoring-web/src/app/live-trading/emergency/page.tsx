import type { Metadata } from 'next';
import { EmergencyControls } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Emergency status · Monitoring' };

/** Emergency Controls & Kill Switch status page. */
export default function EmergencyStatusPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">
        Emergency controls &amp; kill switch
      </h1>
      <EmergencyControls />
    </div>
  );
}
