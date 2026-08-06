import type { Metadata } from 'next';
import Link from 'next/link';
import { ResearchDashboard, ResearchRegistry } from '@/modules/research';

export const metadata: Metadata = { title: 'Research · Research Platform' };

/** Research Engine — Dashboard + Research Registry (Server Component). The
 *  interactive parts are Client Components that fetch through the application
 *  service. */
export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Research</h1>
          <p className="max-w-prose text-muted-foreground">
            The central orchestration engine for quantitative research — coordinating projects from
            hypothesis through feature discovery, signal validation, strategy development and
            portfolio construction.
          </p>
        </div>
        <nav className="flex gap-2 text-sm" aria-label="Research sections">
          <Link
            href="/research/templates"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Templates
          </Link>
          <Link href="/workspace" className="rounded-md border px-3 py-1.5 hover:bg-accent">
            Workspace
          </Link>
        </nav>
      </div>
      <ResearchDashboard />
      <ResearchRegistry />
    </div>
  );
}
