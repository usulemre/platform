/**
 * Feature Calculation module (v1, research-web) — the module's public surface for research-web's
 * routing layer. Only container components are exported; the domain, data and application layers are
 * internal. The data layer runs the REAL calculation SDK to produce live results.
 */
export { FeatureCalculationDashboard } from './components/feature-calculation-dashboard';
export { CalculationExplorer } from './components/calculation-explorer';
export { FeatureBenchmark } from './components/feature-benchmark';
export {
  ExecutionHistory,
  ExecutionStatus,
  PerformanceMetrics,
} from './components/execution-views';
export { CalcLoading, CalcError } from './components/feature-calculation-atoms';
