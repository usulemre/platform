/**
 * In-memory read-model adapters. Development/test only — no persistence, no
 * external calls. They implement the query ports over the synthetic seed.
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
import type {
  AssetQueryPort,
  CalendarQueryPort,
  DatasetQueryPort,
  ExchangeQueryPort,
  SessionQueryPort,
  SymbolQueryPort,
  TimeSeriesQueryPort,
} from '../ports';
import {
  ASSETS,
  DATASETS,
  EXCHANGES,
  HOLIDAY_CALENDARS,
  MARKET_EVENTS,
  SESSIONS,
  SYMBOLS,
  TIME_SERIES,
} from './seed';

export class InMemoryAssetQuery implements AssetQueryPort {
  constructor(private readonly data: readonly Asset[] = ASSETS) {}
  async list(): Promise<readonly Asset[]> {
    return this.data;
  }
}

export class InMemoryExchangeQuery implements ExchangeQueryPort {
  constructor(private readonly data: readonly Exchange[] = EXCHANGES) {}
  async list(): Promise<readonly Exchange[]> {
    return this.data;
  }
  async getById(id: string): Promise<Exchange | null> {
    return this.data.find((exchange) => exchange.id === id) ?? null;
  }
}

export class InMemorySymbolQuery implements SymbolQueryPort {
  constructor(private readonly data: readonly SymbolRecord[] = SYMBOLS) {}
  async list(): Promise<readonly SymbolRecord[]> {
    return this.data;
  }
  async getById(id: string): Promise<SymbolRecord | null> {
    return this.data.find((symbol) => symbol.id === id) ?? null;
  }
}

export class InMemoryDatasetQuery implements DatasetQueryPort {
  constructor(private readonly data: readonly Dataset[] = DATASETS) {}
  async list(): Promise<readonly Dataset[]> {
    return this.data;
  }
  async getById(id: string): Promise<Dataset | null> {
    return this.data.find((dataset) => dataset.id === id) ?? null;
  }
}

export class InMemoryTimeSeriesQuery implements TimeSeriesQueryPort {
  constructor(private readonly data: readonly TimeSeriesRef[] = TIME_SERIES) {}
  async list(): Promise<readonly TimeSeriesRef[]> {
    return this.data;
  }
  async listForDataset(datasetId: string): Promise<readonly TimeSeriesRef[]> {
    return this.data.filter((series) => series.datasetId === datasetId);
  }
}

export class InMemoryCalendarQuery implements CalendarQueryPort {
  constructor(
    private readonly events: readonly MarketEvent[] = MARKET_EVENTS,
    private readonly calendars: readonly HolidayCalendar[] = HOLIDAY_CALENDARS,
  ) {}
  async listEvents(): Promise<readonly MarketEvent[]> {
    return this.events;
  }
  async listHolidayCalendars(): Promise<readonly HolidayCalendar[]> {
    return this.calendars;
  }
}

export class InMemorySessionQuery implements SessionQueryPort {
  constructor(private readonly data: readonly TradingSession[] = SESSIONS) {}
  async list(): Promise<readonly TradingSession[]> {
    return this.data;
  }
}
