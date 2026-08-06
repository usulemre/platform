/**
 * Performance Analytics Engine module (v1, admin-web) — the module's public surface for
 * admin-web's routing layer. Only container components are exported; the domain, data and
 * application layers are internal. Self-contained copy: the admin mappers do not deep-link into
 * research-web modules (dependency/subject cross-links render as plain labels).
 */
export { PerformanceDashboard } from './components/performance-dashboard';
export { ReportRegistry } from './components/report-registry';
export { ReportDetailView } from './components/report-detail-view';
export { MetricCatalog, MetricExplorer } from './components/metric-catalog';
export {
  PerformanceComparisons,
  PerformanceComparisonView,
} from './components/performance-comparisons';
export { PerformanceReviewQueues, BenchmarkList } from './components/performance-views';
export { PerformanceLoading, PerformanceError } from './components/performance-atoms';
