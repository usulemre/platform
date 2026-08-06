/**
 * Portfolio Optimization module (v1, research-web) — the module's public surface for research-web's
 * routing layer. Only container components are exported; the domain, data and application layers are
 * internal. The data layer runs the REAL optimization SDK to produce live allocations.
 */
export { PortfolioOptimizationDashboard } from './components/portfolio-optimization-dashboard';
export { ConstraintEditor } from './components/constraint-editor';
export { AllocationExplorer } from './components/allocation-explorer';
export { EfficientFrontier } from './components/efficient-frontier';
export { PortfolioComparison } from './components/portfolio-comparison';
export { OptimizationHistory } from './components/optimization-history';
export { OptLoading, OptError } from './components/portfolio-optimization-atoms';
