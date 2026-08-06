import { OptLoading } from '@/modules/portfolio-optimization';

/** Route-level loading state for the Portfolio Optimization Engine. */
export default function PortfolioOptimizationLoadingRoute() {
  return <OptLoading rows={6} />;
}
