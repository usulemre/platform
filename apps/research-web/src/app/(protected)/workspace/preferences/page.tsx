import type { Metadata } from 'next';
import { WorkspacePreferences } from '@/modules/workspace';

export const metadata: Metadata = {
  title: 'Workspace preferences · Research Platform',
};

/** Workspace preferences page (read-only presentation in v1). */
export default function WorkspacePreferencesPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Workspace preferences</h1>
      <WorkspacePreferences />
    </div>
  );
}
