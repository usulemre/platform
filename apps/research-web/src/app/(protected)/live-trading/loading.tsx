import { TradingLoading } from '@/modules/live-trading';

/** Route-level loading state for the Live Trading Platform. */
export default function LiveTradingLoadingRoute() {
  return <TradingLoading rows={6} />;
}
