import { PerformanceLoading } from '@/modules/performance-analytics';

/** Route-level loading state for the Performance Analytics admin console. */
export default function PerformanceAnalyticsLoadingRoute() {
  return <PerformanceLoading rows={6} />;
}
