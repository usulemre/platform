import type { Metadata } from 'next';
import { AuditExplorer } from '@/modules/audit';

export const metadata: Metadata = {
  title: 'Audit Explorer · Admin',
};

/** Audit Explorer page (Server Component). */
export default function AuditExplorerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Audit Explorer</h1>
      <AuditExplorer />
    </div>
  );
}
