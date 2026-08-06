import type { Metadata } from 'next';
import { WorkspaceHome } from '@/modules/workspace';

export const metadata: Metadata = {
  title: 'Workspace · Research Platform',
};

/** Research Workspace home (Server Component). Unifies datasets, experiments,
 *  features, signals, strategies, portfolios, activity and notifications into a
 *  single read-only productivity surface. Interactive panels fetch through the
 *  workspace application service. */
export default function WorkspacePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Workspace</h1>
        <p className="max-w-prose text-muted-foreground">
          Your research home. A read-only, cross-module view — every panel links into the module
          that owns the artifact; nothing is decided or persisted here.
        </p>
      </div>
      <WorkspaceHome />
    </div>
  );
}
