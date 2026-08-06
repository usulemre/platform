import Link from 'next/link';
import { Bot, CandlestickChart, Plug, Waypoints } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Admin Console</h1>
        <p className="max-w-prose text-muted-foreground">
          Administration and AI governance. Capital-affecting actions are counter-signed at the
          governed backend (CLAUDE.md HO-2); this console never decides.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/agents"
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">AI Agent Console</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage and govern registered AI agents — lifecycle, contracts, evaluation and
                health.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link
          href="/connectors"
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Plug className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Connector Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The canonical integration layer — connector registry, health, configuration,
                capabilities, lifecycle and diagnostics. Abstractions only; no external calls.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link
          href="/data-ingestion"
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Waypoints className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Data Ingestion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The single entry point for external data — pipeline registry, health, metrics,
                validation, failed jobs and the retry/dead-letter queues. Read-only.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link
          href="/market-data"
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <CandlestickChart className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Market Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The canonical market-data layer — symbol/exchange/asset registries, dataset
                explorer, coverage, quality, versions, calendar and the data catalog. Read-only.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
