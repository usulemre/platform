import { MetricExplorer } from '@/modules/performance-analytics';

/** Metric Explorer page (admin, Server Component). Params are async in Next 15. */
export default async function MetricExplorerPage({
  params,
}: {
  params: Promise<{ metricKey: string }>;
}) {
  const { metricKey } = await params;
  return <MetricExplorer metricKey={metricKey} />;
}
