/**
 * Real adapter over the governed API gateway (market-data service). NOT wired in
 * v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never a provider SDK, never persistence.
 */
import type { ApiClient } from '@platform/api-client';
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
import type { MarketDataRepository } from './repository';

function symbolQs(query: SymbolQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.assetClass && query.assetClass !== 'ALL') params.set('assetClass', query.assetClass);
  if (query.exchangeId && query.exchangeId !== 'ALL') params.set('exchangeId', query.exchangeId);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function datasetQs(query: DatasetQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.marketDataType && query.marketDataType !== 'ALL')
    params.set('marketDataType', query.marketDataType);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiMarketDataRepository implements MarketDataRepository {
  constructor(private readonly api: ApiClient) {}

  listAssets(): Promise<readonly Asset[]> {
    return this.api.request<readonly Asset[]>('/market-data/assets');
  }

  listExchanges(): Promise<readonly Exchange[]> {
    return this.api.request<readonly Exchange[]>('/market-data/exchanges');
  }

  listSymbols(query: SymbolQuery): Promise<readonly SymbolRecord[]> {
    return this.api.request<readonly SymbolRecord[]>(`/market-data/symbols${symbolQs(query)}`);
  }

  async getSymbol(id: string): Promise<SymbolRecord | null> {
    try {
      return await this.api.request<SymbolRecord>(`/market-data/symbols/${id}`);
    } catch {
      return null;
    }
  }

  listDatasets(query: DatasetQuery): Promise<readonly Dataset[]> {
    return this.api.request<readonly Dataset[]>(`/market-data/datasets${datasetQs(query)}`);
  }

  async getDataset(id: string): Promise<Dataset | null> {
    try {
      return await this.api.request<Dataset>(`/market-data/datasets/${id}`);
    } catch {
      return null;
    }
  }

  listTimeSeries(datasetId: string): Promise<readonly TimeSeriesRef[]> {
    return this.api.request<readonly TimeSeriesRef[]>(
      `/market-data/datasets/${datasetId}/time-series`,
    );
  }

  listSymbolTimeSeries(symbolId: string): Promise<readonly TimeSeriesRef[]> {
    return this.api.request<readonly TimeSeriesRef[]>(
      `/market-data/symbols/${symbolId}/time-series`,
    );
  }

  listMarketEvents(): Promise<readonly MarketEvent[]> {
    return this.api.request<readonly MarketEvent[]>('/market-data/calendar/events');
  }

  listHolidayCalendars(): Promise<readonly HolidayCalendar[]> {
    return this.api.request<readonly HolidayCalendar[]>('/market-data/calendar/holidays');
  }

  listSessions(): Promise<readonly TradingSession[]> {
    return this.api.request<readonly TradingSession[]>('/market-data/sessions');
  }
}
