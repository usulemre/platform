import type { Metadata } from 'next';
import { EmergencyControls } from '@/modules/live-trading';

export const metadata: Metadata = { title: 'Emergency controls · Admin' };

/** Emergency Controls & Kill Switch page. */
export default function EmergencyControlsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">
        Emergency controls &amp; kill switch
      </h1>
      <EmergencyControls />
    </div>
  );
}
