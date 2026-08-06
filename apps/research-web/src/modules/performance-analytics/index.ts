/**
 * Performance Analytics Engine module (v1, research-web) — the module's public surface for
 * research-web's routing layer. Only container components + route-state atoms are exported;
 * the domain, data and application layers are internal (the app depends on the application
 * layer via these components, never on repositories, the service tier, an analytics runtime,
 * or persistence).
 */
export { PerformanceDashboard } from './components/performance-dashboard';
export { ReportRegistry } from './components/report-registry';
export { ReportDetailView } from './components/report-detail-view';
export { MetricCatalog, MetricExplorer } from './components/metric-catalog';
export {
  PerformanceComparisons,
  PerformanceComparisonView,
} from './components/performance-comparisons';
export {
  SubjectReports,
  ReviewQueue,
  ApprovalQueue,
  PerformanceReviewQueues,
  BenchmarkList,
} from './components/performance-views';
export { PerformanceLoading, PerformanceError } from './components/performance-atoms';
