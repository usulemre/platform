import { TradingLoading } from '@/modules/live-trading';

/** Route-level loading state for the Live Trading admin console. */
export default function LiveTradingLoadingRoute() {
  return <TradingLoading rows={6} />;
}
