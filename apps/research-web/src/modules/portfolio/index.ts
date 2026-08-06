/**
 * Portfolio Module (v1) — public surface for the app's routing layer. Only
 * container views and route-state components are exported; the domain, data and
 * application layers are internal (the app depends on the application layer via
 * these views, never on repositories or infrastructure).
 */
export { PortfolioDashboard } from './components/portfolio-dashboard';
export { PortfoliosView } from './components/portfolios-view';
export { PortfolioDetailView } from './components/portfolio-detail-view';
export { PortfolioLoadingState } from './components/portfolio-loading-state';
export { PortfolioErrorState } from './components/portfolio-error-state';
export { PortfolioEmptyState } from './components/portfolio-empty-state';
