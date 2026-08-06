import type { Metadata } from 'next';
import { AuditTimeline } from '@/modules/audit';

export const metadata: Metadata = {
  title: 'Audit Timeline · Admin',
};

/** Audit Timeline page (Server Component). */
export default function AuditTimelinePage() {
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Audit Timeline</h1>
      <AuditTimeline limit={20} />
    </div>
  );
}
