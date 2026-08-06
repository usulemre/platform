/**
 * Market-data admin repository boundary — the ONLY data abstraction the
 * application service depends on. Concrete adapters implement it; the UI never
 * sees a concrete data source and never touches the service, a provider, or
 * persistence.
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
import type { DatasetQuery, SymbolQuery } from '../domain/query';

export type { DatasetQuery, SymbolQuery };

export interface MarketDataRepository {
  listAssets(): Promise<readonly Asset[]>;
  listExchanges(): Promise<readonly Exchange[]>;
  listSymbols(query: SymbolQuery): Promise<readonly SymbolRecord[]>;
  getSymbol(id: string): Promise<SymbolRecord | null>;
  listDatasets(query: DatasetQuery): Promise<readonly Dataset[]>;
  getDataset(id: string): Promise<Dataset | null>;
  listTimeSeries(datasetId: string): Promise<readonly TimeSeriesRef[]>;
  listSymbolTimeSeries(symbolId: string): Promise<readonly TimeSeriesRef[]>;
  listMarketEvents(): Promise<readonly MarketEvent[]>;
  listHolidayCalendars(): Promise<readonly HolidayCalendar[]>;
  listSessions(): Promise<readonly TradingSession[]>;
}
