import { PerformanceComparisonView } from '@/modules/performance-analytics';

/** Performance comparison detail page (admin, Server Component). Params are async in Next 15. */
export default async function PerformanceComparisonPage({
  params,
}: {
  params: Promise<{ comparisonId: string }>;
}) {
  const { comparisonId } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Comparison</h1>
      <PerformanceComparisonView comparisonId={comparisonId} />
    </div>
  );
}
