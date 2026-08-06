/**
 * Infrastructure INTERFACES (ports) for the market-data service. The application
 * and domain layers depend only on these abstractions; concrete adapters are
 * injected at composition time.
 *
 * This file declares NO implementation: no provider SDK, no persistence engine,
 * no exchange client. Market data is CONSUMED from the Data Ingestion Pipeline as
 * canonical datasets (never fetched from a provider). The in-memory mocks under
 * `./in-memory` are the only adapters shipped in v1.
 */
import type {
  Asset,
  Dataset,
  Exchange,
  HolidayCalendar,
  MarketEvent,
  SymbolRecord,
  TimeSeriesRef,
  TradingSession,
} from '@platform/market-data-sdk';

/* -------------------------- foundation ports --------------------------- */

/** Reference to a canonical dataset produced by the Data Ingestion Pipeline. */
export interface IngestionDatasetHandle {
  readonly ingestionRef: string;
  readonly name: string;
}

/** The market-data service consumes canonical datasets from ingestion ONLY. */
export interface IngestionDatasetPort {
  listCanonicalDatasets(): Promise<readonly IngestionDatasetHandle[]>;
}

/** Validation Foundation — dataset/coverage validation (abstraction). */
export interface ValidationPort {
  isCatalogued(ingestionRef: string): Promise<boolean>;
}

/** Workflow Engine — schedule versioning/refresh jobs. */
export interface WorkflowPort {
  scheduleRefresh(datasetId: string): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}

/* ---------------------------- read models ------------------------------ */

export interface AssetQueryPort {
  list(): Promise<readonly Asset[]>;
}

export interface ExchangeQueryPort {
  list(): Promise<readonly Exchange[]>;
  getById(id: string): Promise<Exchange | null>;
}

export interface SymbolQueryPort {
  list(): Promise<readonly SymbolRecord[]>;
  getById(id: string): Promise<SymbolRecord | null>;
}

export interface DatasetQueryPort {
  list(): Promise<readonly Dataset[]>;
  getById(id: string): Promise<Dataset | null>;
}

export interface TimeSeriesQueryPort {
  list(): Promise<readonly TimeSeriesRef[]>;
  listForDataset(datasetId: string): Promise<readonly TimeSeriesRef[]>;
}

export interface CalendarQueryPort {
  listEvents(): Promise<readonly MarketEvent[]>;
  listHolidayCalendars(): Promise<readonly HolidayCalendar[]>;
}

export interface SessionQueryPort {
  list(): Promise<readonly TradingSession[]>;
}
