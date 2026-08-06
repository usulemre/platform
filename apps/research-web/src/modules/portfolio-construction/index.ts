/**
 * Portfolio Construction Engine module (v1) — the module's public surface for
 * research-web's routing layer. Only container components + route-state atoms are
 * exported; the domain, data and application layers are internal (the app depends on
 * the application layer via these components, never on repositories, the service tier,
 * a broker, an optimizer, or persistence).
 */
export { PortfolioConstructionDashboard } from './components/portfolio-construction-dashboard';
export { PortfolioRegistry } from './components/portfolio-registry';
export { PortfolioBuilder } from './components/portfolio-builder';
export { PortfolioDetailView } from './components/portfolio-detail-view';
export {
  PortfolioQueues,
  OptimizationQueueView,
  ApprovalQueueView,
} from './components/portfolio-queue';
export { PortfolioOptimizationRequests } from './components/portfolio-optimization-requests';
export { PortfolioComparisons, PortfolioComparisonView } from './components/portfolio-comparisons';
export { PortfolioFamilies } from './components/portfolio-families';
export {
  PortfolioConstructionLoading,
  PortfolioConstructionError,
} from './components/portfolio-construction-atoms';
