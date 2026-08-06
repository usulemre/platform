import { StrategyDetailView } from '@/modules/strategy';

/** Strategy Details page (Server Component). Route params are async in Next 15. */
export default async function StrategyDetailPage({
  params,
}: {
  params: Promise<{ strategyId: string }>;
}) {
  const { strategyId } = await params;
  return <StrategyDetailView strategyId={strategyId} />;
}
