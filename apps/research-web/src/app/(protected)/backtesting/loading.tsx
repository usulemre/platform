import { BacktestingLoading } from '@/modules/backtesting';

/** Route-level loading state for the Backtesting Engine. */
export default function BacktestingLoadingRoute() {
  return <BacktestingLoading rows={6} />;
}
