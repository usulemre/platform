'use client';

import Link from 'next/link';
import { Card, CardContent } from '@platform/ui';
import { useQuickActions, useWorkspaceSummary } from '../hooks/use-workspace';
import { GlobalSearchButton, InfoCard, WsEmpty, WsError, WsLoading } from './workspace-atoms';

function SummaryCards() {
  const query = useWorkspaceSummary();
  if (query.isLoading) return <WsLoading rows={2} />;
  if (query.isError) return <WsError onRetry={query.refetch} />;
  if (!query.data || query.data.length === 0) return <WsEmpty label="No summary available." />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {query.data.map((stat) => (
        <Link key={stat.key} href={stat.href} className="block">
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="p-4">
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function QuickActions() {
  const query = useQuickActions();
  return (
    <InfoCard title="Quick actions">
      {query.isLoading ? (
        <WsLoading rows={2} />
      ) : query.isError ? (
        <WsError onRetry={query.refetch} />
      ) : !query.data || query.data.length === 0 ? (
        <WsEmpty label="No quick actions." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {query.data.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </InfoCard>
  );
}

/** Research Dashboard: the at-a-glance top of the workspace home. */
export function ResearchDashboard() {
  return (
    <section className="space-y-4" aria-label="Research dashboard">
      <GlobalSearchButton />
      <SummaryCards />
      <QuickActions />
    </section>
  );
}
