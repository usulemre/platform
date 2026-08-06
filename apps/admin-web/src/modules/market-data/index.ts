/**
 * Market Data admin module (v1) — the module's public surface for admin-web's
 * routing layer. Only container components + route-state atoms are exported; the
 * domain, data and application layers are internal (the app depends on the
 * application layer via these components, never on repositories, the service tier,
 * a provider, or persistence).
 */
export { MarketDataDashboard } from './components/market-dashboard';
export { SymbolRegistry } from './components/symbol-registry';
export { SymbolDetailView } from './components/symbol-detail-view';
export { ExchangeRegistry } from './components/exchange-registry';
export { AssetRegistry } from './components/asset-registry';
export { DatasetExplorer } from './components/dataset-explorer';
export { DatasetDetailView } from './components/dataset-detail-view';
export { MarketCalendar, TradingSessions } from './components/market-calendar';
export { DataCatalog } from './components/data-catalog';
export { MarketLoading, MarketError } from './components/market-atoms';
