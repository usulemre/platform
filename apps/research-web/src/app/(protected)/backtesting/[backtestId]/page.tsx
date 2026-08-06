import { BacktestDetailView } from '@/modules/backtesting';

/** Backtest details page (Server Component). Params are async in Next 15. */
export default async function BacktestDetailPage({
  params,
}: {
  params: Promise<{ backtestId: string }>;
}) {
  const { backtestId } = await params;
  return <BacktestDetailView backtestId={backtestId} />;
}
