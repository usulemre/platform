/**
 * @services/market-data-service — the canonical Market Data Platform.
 *
 * Provides a unified, normalized, versioned view of market data. It CONSUMES only
 * canonical datasets produced by the Data Ingestion Pipeline (never a provider),
 * exposes a domain layer, an application layer, and infrastructure INTERFACES
 * (ports); the only adapters shipped in v1 are in-memory mocks. No exchange-
 * specific logic, no provider SDKs, no persistence, no secrets.
 */
export * from './domain/derivations';
export * from './domain/symbol-resolution';

export * from './application/market-data-service';

export * from './infrastructure/ports';
export {
  InMemoryAssetQuery,
  InMemoryExchangeQuery,
  InMemorySymbolQuery,
  InMemoryDatasetQuery,
  InMemoryTimeSeriesQuery,
  InMemoryCalendarQuery,
  InMemorySessionQuery,
} from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export {
  ASSETS,
  EXCHANGES,
  SYMBOLS,
  DATASETS,
  TIME_SERIES,
  MARKET_EVENTS,
  SESSIONS,
  HOLIDAY_CALENDARS,
} from './infrastructure/in-memory/seed';

export * from './composition';
