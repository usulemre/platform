/**
 * Market-data admin application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository and maps canonical DTOs to view models. No
 * infrastructure, no exchange-specific logic, no persistence. Aggregation is pure.
 */
import type { DatasetVersion } from '@platform/market-data-sdk';
import {
  toAssetVm,
  toCatalogEntryVm,
  toCoverageRowVm,
  toDatasetDetailVm,
  toDatasetListItemVm,
  toExchangeVm,
  toHolidayCalendarVm,
  toMarketEventVm,
  toQualityRowVm,
  toSessionVm,
  toSummaryVm,
  toSymbolDetailVm,
  toSymbolListItemVm,
  toTimeSeriesVm,
} from '../domain/mappers';
import type { DatasetQuery, SymbolQuery } from '../domain/query';
import type {
  AssetVm,
  CatalogEntryVm,
  CoverageRowVm,
  DatasetDetailVm,
  DatasetListItemVm,
  ExchangeVm,
  HolidayCalendarVm,
  MarketDataSummaryVm,
  MarketEventVm,
  QualityRowVm,
  SessionVm,
  SymbolDetailVm,
  SymbolListItemVm,
  TimeSeriesVm,
} from '../domain/view-model';
import type { MarketDataRepository } from '../data/repository';

export interface SymbolDetailBundle {
  readonly symbol: SymbolDetailVm;
  readonly datasets: readonly DatasetListItemVm[];
  readonly timeSeries: readonly TimeSeriesVm[];
}

export interface DatasetDetailBundle {
  readonly dataset: DatasetDetailVm;
  readonly timeSeries: readonly TimeSeriesVm[];
}

export interface MarketCalendarBundle {
  readonly events: readonly MarketEventVm[];
  readonly calendars: readonly HolidayCalendarVm[];
}

function latestVersionLabel(versions: readonly DatasetVersion[], fallback: string): string {
  const latest = versions.reduce<DatasetVersion | null>((best, candidate) => {
    if (!best) return candidate;
    return candidate.createdAt > best.createdAt ? candidate : best;
  }, null);
  return latest?.version ?? fallback;
}

export class MarketDataService {
  constructor(private readonly repository: MarketDataRepository) {}

  async getSummary(): Promise<MarketDataSummaryVm> {
    const [assets, exchanges, symbols, datasets] = await Promise.all([
      this.repository.listAssets(),
      this.repository.listExchanges(),
      this.repository.listSymbols({}),
      this.repository.listDatasets({}),
    ]);
    return toSummaryVm(assets, exchanges, symbols, datasets);
  }

  async listAssets(): Promise<AssetVm[]> {
    return (await this.repository.listAssets()).map(toAssetVm);
  }

  async listExchanges(): Promise<ExchangeVm[]> {
    return (await this.repository.listExchanges()).map(toExchangeVm);
  }

  async listSymbols(query: SymbolQuery = {}): Promise<SymbolListItemVm[]> {
    return (await this.repository.listSymbols(query)).map(toSymbolListItemVm);
  }

  async getSymbol(id: string): Promise<SymbolDetailBundle | null> {
    const symbol = await this.repository.getSymbol(id);
    if (!symbol) return null;
    const [datasets, timeSeries] = await Promise.all([
      this.repository.listDatasets({}),
      this.repository.listSymbolTimeSeries(id),
    ]);
    return {
      symbol: toSymbolDetailVm(symbol),
      datasets: datasets.filter((dataset) => dataset.symbolId === id).map(toDatasetListItemVm),
      timeSeries: timeSeries.map(toTimeSeriesVm),
    };
  }

  async listDatasets(query: DatasetQuery = {}): Promise<DatasetListItemVm[]> {
    return (await this.repository.listDatasets(query)).map(toDatasetListItemVm);
  }

  async getDataset(id: string): Promise<DatasetDetailBundle | null> {
    const dataset = await this.repository.getDataset(id);
    if (!dataset) return null;
    const timeSeries = await this.repository.listTimeSeries(id);
    return { dataset: toDatasetDetailVm(dataset), timeSeries: timeSeries.map(toTimeSeriesVm) };
  }

  async getDataCoverage(): Promise<CoverageRowVm[]> {
    return (await this.repository.listDatasets({})).map(toCoverageRowVm);
  }

  async getDataQualityOverview(): Promise<QualityRowVm[]> {
    return (await this.repository.listDatasets({})).map(toQualityRowVm);
  }

  async getCatalog(): Promise<CatalogEntryVm[]> {
    return (await this.repository.listDatasets({})).map((dataset) =>
      toCatalogEntryVm(dataset, latestVersionLabel(dataset.versions, dataset.version)),
    );
  }

  async getCalendar(): Promise<MarketCalendarBundle> {
    const [events, calendars] = await Promise.all([
      this.repository.listMarketEvents(),
      this.repository.listHolidayCalendars(),
    ]);
    return { events: events.map(toMarketEventVm), calendars: calendars.map(toHolidayCalendarVm) };
  }

  async getSessions(): Promise<SessionVm[]> {
    return (await this.repository.listSessions()).map(toSessionVm);
  }
}
