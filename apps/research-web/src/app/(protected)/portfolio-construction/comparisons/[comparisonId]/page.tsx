import { PortfolioComparisonView } from '@/modules/portfolio-construction';

/** Portfolio comparison detail page (Server Component). Params are async in Next 15. */
export default async function PortfolioComparisonPage({
  params,
}: {
  params: Promise<{ comparisonId: string }>;
}) {
  const { comparisonId } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Comparison</h1>
      <PortfolioComparisonView comparisonId={comparisonId} />
    </div>
  );
}
