import type { Metadata } from 'next';
import { AuditDashboard } from '@/modules/audit';

export const metadata: Metadata = {
  title: 'Audit Center · Admin',
};

/** Audit Dashboard page (Server Component). The interactive sections are Client
 *  Components that fetch through the application service. */
export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Audit Center</h1>
        <p className="max-w-prose text-muted-foreground">
          The single source of truth for operational traceability and governance compliance.
          Read-only — events are emitted by the governed services; this console never writes them.
        </p>
      </div>
      <AuditDashboard />
    </div>
  );
}
