/**
 * Market-data application service — the read surface of the market-data service.
 * It orchestrates ports only (query ports, ingestion source, validation,
 * workflow); it holds no infrastructure, no provider logic, no persistence. Any
 * computed field (coverage status, quality grade, latest version) comes from the
 * pure domain derivations.
 */
import type {
  Asset,
  Dataset,
  Exchange,
  HolidayCalendar,
  MarketDataType,
  MarketEvent,
  SymbolRecord,
  TimeSeriesRef,
  TradingSession,
} from '@platform/market-data-sdk';
import { coverageStatus, latestVersion, qualityGrade } from '../domain/derivations';
import { resolve } from '../domain/symbol-resolution';
import type {
  AssetQueryPort,
  CalendarQueryPort,
  DatasetQueryPort,
  ExchangeQueryPort,
  IngestionDatasetHandle,
  IngestionDatasetPort,
  SessionQueryPort,
  SymbolQueryPort,
  TimeSeriesQueryPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface MarketDataSummary {
  readonly assets: number;
  readonly exchanges: number;
  readonly symbols: number;
  readonly datasets: number;
  readonly activeDatasets: number;
  readonly timeSeries: number;
}

export interface CoverageRow {
  readonly datasetId: string;
  readonly name: string;
  readonly status: Dataset['coverage']['status'];
  readonly completeness: number;
  readonly gaps: number;
  readonly startAt?: string;
  readonly endAt?: string;
}

export interface QualityRow {
  readonly datasetId: string;
  readonly name: string;
  readonly grade: Dataset['quality']['grade'];
  readonly completeness: number;
  readonly validity: number;
}

export interface CatalogEntry {
  readonly datasetId: string;
  readonly name: string;
  readonly marketDataType: MarketDataType;
  readonly assetClass: Dataset['assetClass'];
  readonly exchangeId: string;
  readonly status: Dataset['status'];
  readonly latestVersion: string;
}

export interface MarketDataServiceDeps {
  readonly assets: AssetQueryPort;
  readonly exchanges: ExchangeQueryPort;
  readonly symbols: SymbolQueryPort;
  readonly datasets: DatasetQueryPort;
  readonly timeSeries: TimeSeriesQueryPort;
  readonly calendars: CalendarQueryPort;
  readonly sessions: SessionQueryPort;
  readonly ingestion: IngestionDatasetPort;
  readonly workflow: WorkflowPort;
}

export class MarketDataService {
  constructor(private readonly deps: MarketDataServiceDeps) {}

  listAssets(): Promise<readonly Asset[]> {
    return this.deps.assets.list();
  }

  listExchanges(): Promise<readonly Exchange[]> {
    return this.deps.exchanges.list();
  }

  getExchange(id: string): Promise<Exchange | null> {
    return this.deps.exchanges.getById(id);
  }

  listSymbols(): Promise<readonly SymbolRecord[]> {
    return this.deps.symbols.list();
  }

  getSymbol(id: string): Promise<SymbolRecord | null> {
    return this.deps.symbols.getById(id);
  }

  /** Symbol Resolution capability — resolve native/alias/canonical to canonical. */
  async resolveSymbol(query: string): Promise<SymbolRecord | null> {
    return resolve(query, await this.deps.symbols.list());
  }

  listDatasets(): Promise<readonly Dataset[]> {
    return this.deps.datasets.list();
  }

  getDataset(id: string): Promise<Dataset | null> {
    return this.deps.datasets.getById(id);
  }

  getDatasetTimeSeries(datasetId: string): Promise<readonly TimeSeriesRef[]> {
    return this.deps.timeSeries.listForDataset(datasetId);
  }

  listMarketEvents(): Promise<readonly MarketEvent[]> {
    return this.deps.calendars.listEvents();
  }

  listHolidayCalendars(): Promise<readonly HolidayCalendar[]> {
    return this.deps.calendars.listHolidayCalendars();
  }

  listSessions(): Promise<readonly TradingSession[]> {
    return this.deps.sessions.list();
  }

  listCanonicalDatasetHandles(): Promise<readonly IngestionDatasetHandle[]> {
    return this.deps.ingestion.listCanonicalDatasets();
  }

  async getSummary(): Promise<MarketDataSummary> {
    const [assets, exchanges, symbols, datasets, timeSeries] = await Promise.all([
      this.deps.assets.list(),
      this.deps.exchanges.list(),
      this.deps.symbols.list(),
      this.deps.datasets.list(),
      this.deps.timeSeries.list(),
    ]);
    return {
      assets: assets.length,
      exchanges: exchanges.length,
      symbols: symbols.length,
      datasets: datasets.length,
      activeDatasets: datasets.filter((dataset) => dataset.status === 'ACTIVE').length,
      timeSeries: timeSeries.length,
    };
  }

  async getDataCoverage(): Promise<readonly CoverageRow[]> {
    const datasets = await this.deps.datasets.list();
    return datasets.map((dataset) => ({
      datasetId: dataset.id,
      name: dataset.name,
      status: coverageStatus(dataset.coverage.completeness, dataset.coverage.gaps),
      completeness: dataset.coverage.completeness,
      gaps: dataset.coverage.gaps,
      startAt: dataset.coverage.startAt,
      endAt: dataset.coverage.endAt,
    }));
  }

  async getDataQualityOverview(): Promise<readonly QualityRow[]> {
    const datasets = await this.deps.datasets.list();
    return datasets.map((dataset) => ({
      datasetId: dataset.id,
      name: dataset.name,
      grade: qualityGrade(dataset.quality.completeness, dataset.quality.validity),
      completeness: dataset.quality.completeness,
      validity: dataset.quality.validity,
    }));
  }

  async getDataCatalog(): Promise<readonly CatalogEntry[]> {
    const datasets = await this.deps.datasets.list();
    return datasets.map((dataset) => ({
      datasetId: dataset.id,
      name: dataset.name,
      marketDataType: dataset.marketDataType,
      assetClass: dataset.assetClass,
      exchangeId: dataset.exchangeId,
      status: dataset.status,
      latestVersion: latestVersion(dataset.versions)?.version ?? dataset.version,
    }));
  }

  /** Schedule a dataset refresh through the Workflow Engine (abstraction). */
  async scheduleRefresh(datasetId: string): Promise<boolean> {
    const dataset = await this.deps.datasets.getById(datasetId);
    if (!dataset) return false;
    await this.deps.workflow.scheduleRefresh(datasetId);
    return true;
  }
}
