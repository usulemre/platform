import { PerformanceLoading } from '@/modules/performance-analytics';

/** Route-level loading state for the Performance Analytics Engine. */
export default function PerformanceAnalyticsLoadingRoute() {
  return <PerformanceLoading rows={6} />;
}
