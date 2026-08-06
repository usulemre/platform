'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import {
  useDataCoverage,
  useDataQualityOverview,
  useMarketDataSummary,
} from '../hooks/use-market-data';
import { InfoCard, MarketEmpty, MarketError, PlatformNotice, StatusBadge } from './market-atoms';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function SummarySection() {
  const { data, isLoading } = useMarketDataSummary();
  if (isLoading || !data) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        aria-busy="true"
        aria-label="Loading summary"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Assets" value={data.assets} />
        <StatCard label="Exchanges" value={data.exchanges} />
        <StatCard label="Symbols" value={data.symbols} />
        <StatCard label="Datasets" value={data.datasets} />
      </div>
      {data.byAssetClass.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Symbols by asset class
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {data.byAssetClass.map((bucket) => (
              <span key={bucket.value} className="inline-flex items-center gap-1">
                <StatusBadge label={bucket.label} tone={bucket.tone} />
                <span className="text-sm text-muted-foreground">{bucket.count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {data.byMarketDataType.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Datasets by market-data type
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {data.byMarketDataType.map((bucket) => (
              <span key={bucket.value} className="inline-flex items-center gap-1">
                <StatusBadge label={bucket.label} tone={bucket.tone} />
                <span className="text-sm text-muted-foreground">{bucket.count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CoverageOverview() {
  const { data, isLoading, isError, refetch } = useDataCoverage();
  return (
    <InfoCard title="Data coverage">
      {isLoading ? (
        <MarketEmpty label="Loading coverage…" />
      ) : isError ? (
        <MarketError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <MarketEmpty label="No coverage data." />
      ) : (
        <ul className="space-y-1 text-sm">
          {data.map((row) => (
            <li
              key={row.datasetId}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <Link
                href={`/market-data/datasets/${row.datasetId}`}
                className="truncate font-medium hover:underline"
              >
                {row.name}
              </Link>
              <span className="flex shrink-0 items-center gap-2">
                <StatusBadge label={row.status.label} tone={row.status.tone} />
                <span className="text-xs text-muted-foreground">{row.completeness}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

function QualityOverview() {
  const { data, isLoading, isError, refetch } = useDataQualityOverview();
  return (
    <InfoCard title="Data quality overview">
      {isLoading ? (
        <MarketEmpty label="Loading quality…" />
      ) : isError ? (
        <MarketError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <MarketEmpty label="No quality data." />
      ) : (
        <ul className="space-y-1 text-sm">
          {data.map((row) => (
            <li
              key={row.datasetId}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <Link
                href={`/market-data/datasets/${row.datasetId}`}
                className="truncate font-medium hover:underline"
              >
                {row.name}
              </Link>
              <span className="flex shrink-0 items-center gap-2">
                <StatusBadge label={row.grade.label} tone={row.grade.tone} />
                <span className="text-xs text-muted-foreground">
                  {row.completeness} · {row.validity}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Market Data dashboard — headline counts, distributions, coverage and quality. */
export function MarketDataDashboard() {
  return (
    <div className="space-y-4">
      <PlatformNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-2">
        <CoverageOverview />
        <QualityOverview />
      </div>
    </div>
  );
}
