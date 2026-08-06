/**
 * In-memory mock adapter for the market-data admin UI. Synthetic canonical
 * METADATA ONLY — no real market data, no provider fields, no persistence. This
 * is the UI's own mock, independent of the service tier.
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
import {
  applyDatasetQuery,
  applySymbolQuery,
  type DatasetQuery,
  type SymbolQuery,
} from '../domain/query';
import type { MarketDataRepository } from './repository';

const EXCHANGES: readonly Exchange[] = [
  {
    id: 'EX-BINANCE',
    code: 'BINANCE',
    name: 'Binance',
    region: 'Global',
    timezone: 'UTC',
    assetClasses: ['CRYPTO'],
  },
  {
    id: 'EX-DERIBIT',
    code: 'DERIBIT',
    name: 'Deribit',
    region: 'Global',
    timezone: 'UTC',
    assetClasses: ['CRYPTO', 'OPTIONS'],
  },
  {
    id: 'EX-NASDAQ',
    code: 'NASDAQ',
    name: 'Nasdaq',
    region: 'US',
    timezone: 'America/New_York',
    mic: 'XNAS',
    assetClasses: ['EQUITY'],
  },
  {
    id: 'EX-CME',
    code: 'CME',
    name: 'CME',
    region: 'US',
    timezone: 'America/Chicago',
    mic: 'XCME',
    assetClasses: ['FUTURES', 'INDEX'],
  },
];

const ASSETS: readonly Asset[] = [
  { id: 'AS-BTC', symbol: 'BTC', name: 'Bitcoin', assetClass: 'CRYPTO' },
  { id: 'AS-ETH', symbol: 'ETH', name: 'Ethereum', assetClass: 'CRYPTO' },
  { id: 'AS-USDT', symbol: 'USDT', name: 'Tether', assetClass: 'CRYPTO' },
  { id: 'AS-AAPL', symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'EQUITY' },
  { id: 'AS-SPX', symbol: 'SPX', name: 'S&P 500 Index', assetClass: 'INDEX' },
  { id: 'AS-ES', symbol: 'ES', name: 'E-mini S&P 500 Future', assetClass: 'FUTURES' },
];

const SYMBOLS: readonly SymbolRecord[] = [
  {
    id: 'SY-BINANCE-BTC-USDT',
    canonical: 'BINANCE:BTC-USDT',
    native: 'BTCUSDT',
    assetClass: 'CRYPTO',
    exchangeId: 'EX-BINANCE',
    kind: 'SPOT',
    base: 'BTC',
    quote: 'USDT',
    aliases: ['btcusdt', 'BTC/USDT'],
  },
  {
    id: 'SY-BINANCE-ETH-USDT',
    canonical: 'BINANCE:ETH-USDT',
    native: 'ETHUSDT',
    assetClass: 'CRYPTO',
    exchangeId: 'EX-BINANCE',
    kind: 'SPOT',
    base: 'ETH',
    quote: 'USDT',
    aliases: ['ethusdt'],
  },
  {
    id: 'SY-DERIBIT-BTC-PERP',
    canonical: 'DERIBIT:BTC-PERP',
    native: 'BTC-PERPETUAL',
    assetClass: 'CRYPTO',
    exchangeId: 'EX-DERIBIT',
    kind: 'PERP',
    base: 'BTC',
    quote: 'USD',
    aliases: ['btc-perpetual'],
  },
  {
    id: 'SY-DERIBIT-BTC-OPT',
    canonical: 'DERIBIT:BTC-OPTION',
    native: 'BTC-OPTIONS',
    assetClass: 'OPTIONS',
    exchangeId: 'EX-DERIBIT',
    kind: 'OPTION',
    base: 'BTC',
    quote: 'USD',
    aliases: [],
  },
  {
    id: 'SY-NASDAQ-AAPL',
    canonical: 'NASDAQ:AAPL',
    native: 'AAPL',
    assetClass: 'EQUITY',
    exchangeId: 'EX-NASDAQ',
    kind: 'SPOT',
    aliases: ['aapl'],
  },
  {
    id: 'SY-CME-ES',
    canonical: 'CME:ES',
    native: 'ES',
    assetClass: 'FUTURES',
    exchangeId: 'EX-CME',
    kind: 'FUTURE',
    aliases: ['es1!'],
  },
];

function version(v: string, createdAt: string, note: string, rows: string) {
  return { version: v, createdAt, note, rows };
}

const DATASETS: readonly Dataset[] = [
  {
    id: 'DS-BINANCE-BTC-OHLCV-1m',
    name: 'Binance BTC-USDT OHLCV (1m)',
    marketDataType: 'OHLCV',
    assetClass: 'CRYPTO',
    exchangeId: 'EX-BINANCE',
    symbolId: 'SY-BINANCE-BTC-USDT',
    timeframe: '1m',
    status: 'ACTIVE',
    version: '3.2.0',
    ingestionRef: 'ds-binance-ohlcv',
    coverage: {
      status: 'COMPLETE',
      startAt: '2019-09-08T00:00:00.000Z',
      endAt: '2026-08-02T00:00:00.000Z',
      completeness: 0.9995,
      gaps: 0,
    },
    quality: {
      grade: 'PASS',
      completeness: 0.9995,
      validity: 0.9999,
      checkedAt: '2026-08-02T00:00:00.000Z',
    },
    versions: [
      version('3.2.0', '2026-08-01T00:00:00.000Z', 'Incremental refresh.', '3.5B'),
      version('3.1.0', '2026-07-01T00:00:00.000Z', 'Gap backfill.', '3.4B'),
    ],
    metadata: [
      { key: 'source', value: 'ingestion:ds-binance-ohlcv' },
      { key: 'timezone', value: 'UTC' },
      { key: 'adjusted', value: 'false' },
    ],
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'DS-DERIBIT-BTC-OPTIONS',
    name: 'Deribit BTC options chains',
    marketDataType: 'OPTIONS',
    assetClass: 'OPTIONS',
    exchangeId: 'EX-DERIBIT',
    symbolId: 'SY-DERIBIT-BTC-OPT',
    timeframe: '1h',
    status: 'STALE',
    version: '1.4.0',
    ingestionRef: 'ds-deribit-options',
    coverage: {
      status: 'PARTIAL',
      startAt: '2021-01-01T00:00:00.000Z',
      endAt: '2026-08-01T00:00:00.000Z',
      completeness: 0.972,
      gaps: 14,
    },
    quality: {
      grade: 'WARN',
      completeness: 0.972,
      validity: 0.981,
      checkedAt: '2026-08-01T00:00:00.000Z',
    },
    versions: [version('1.4.0', '2026-07-30T00:00:00.000Z', 'Greeks recompute.', '820M')],
    metadata: [
      { key: 'source', value: 'ingestion:ds-deribit-options' },
      { key: 'greeks', value: 'included' },
    ],
    updatedAt: '2026-07-30T00:00:00.000Z',
  },
  {
    id: 'DS-DERIBIT-BTC-FUNDING',
    name: 'Deribit BTC-PERP funding rates',
    marketDataType: 'FUNDING_RATES',
    assetClass: 'CRYPTO',
    exchangeId: 'EX-DERIBIT',
    symbolId: 'SY-DERIBIT-BTC-PERP',
    timeframe: '1h',
    status: 'ACTIVE',
    version: '2.0.0',
    ingestionRef: 'ds-deribit-funding',
    coverage: {
      status: 'COMPLETE',
      startAt: '2020-01-01T00:00:00.000Z',
      endAt: '2026-08-02T00:00:00.000Z',
      completeness: 0.9992,
      gaps: 1,
    },
    quality: {
      grade: 'PASS',
      completeness: 0.9992,
      validity: 0.9997,
      checkedAt: '2026-08-02T00:00:00.000Z',
    },
    versions: [version('2.0.0', '2026-07-20T00:00:00.000Z', 'Schema v2.', '58M')],
    metadata: [
      { key: 'source', value: 'ingestion:ds-deribit-funding' },
      { key: 'interval', value: '8h' },
    ],
    updatedAt: '2026-07-20T00:00:00.000Z',
  },
  {
    id: 'DS-NASDAQ-AAPL-OHLCV-1d',
    name: 'Nasdaq AAPL OHLCV (1d)',
    marketDataType: 'OHLCV',
    assetClass: 'EQUITY',
    exchangeId: 'EX-NASDAQ',
    symbolId: 'SY-NASDAQ-AAPL',
    timeframe: '1d',
    status: 'ACTIVE',
    version: '5.1.0',
    ingestionRef: 'ds-polygon-equity',
    coverage: {
      status: 'COMPLETE',
      startAt: '1990-01-01T00:00:00.000Z',
      endAt: '2026-08-01T00:00:00.000Z',
      completeness: 1,
      gaps: 0,
    },
    quality: {
      grade: 'PASS',
      completeness: 1,
      validity: 0.9998,
      checkedAt: '2026-08-01T00:00:00.000Z',
    },
    versions: [version('5.1.0', '2026-08-01T00:00:00.000Z', 'Corporate-actions adjust.', '9.1K')],
    metadata: [
      { key: 'source', value: 'ingestion:ds-polygon-equity' },
      { key: 'adjusted', value: 'true' },
    ],
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'DS-NASDAQ-AAPL-CA',
    name: 'Nasdaq AAPL corporate actions',
    marketDataType: 'CORPORATE_ACTIONS',
    assetClass: 'EQUITY',
    exchangeId: 'EX-NASDAQ',
    symbolId: 'SY-NASDAQ-AAPL',
    status: 'DEPRECATED',
    version: '0.9.0',
    ingestionRef: 'ds-polygon-ca',
    coverage: { status: 'SPARSE', completeness: 0.88, gaps: 6 },
    quality: {
      grade: 'FAIL',
      completeness: 0.88,
      validity: 0.91,
      checkedAt: '2026-07-31T00:00:00.000Z',
    },
    versions: [version('0.9.0', '2026-05-01T00:00:00.000Z', 'Initial.', '412')],
    metadata: [
      { key: 'source', value: 'ingestion:ds-polygon-ca' },
      { key: 'vintage', value: 'as-of' },
    ],
    updatedAt: '2026-07-31T00:00:00.000Z',
  },
  {
    id: 'DS-CME-ES-INDEX',
    name: 'CME ES index prices',
    marketDataType: 'INDEX_PRICES',
    assetClass: 'INDEX',
    exchangeId: 'EX-CME',
    symbolId: 'SY-CME-ES',
    timeframe: '1m',
    status: 'EMPTY',
    version: '0.1.0',
    ingestionRef: 'ds-cme-es-index',
    coverage: { status: 'MISSING', completeness: 0, gaps: 0 },
    quality: { grade: 'FAIL', completeness: 0, validity: 0, checkedAt: '2026-07-25T00:00:00.000Z' },
    versions: [
      version('0.1.0', '2026-07-25T00:00:00.000Z', 'Registered; awaiting ingestion.', '0'),
    ],
    metadata: [{ key: 'source', value: 'ingestion:ds-cme-es-index' }],
    updatedAt: '2026-07-25T00:00:00.000Z',
  },
];

const TIME_SERIES: readonly TimeSeriesRef[] = [
  {
    datasetId: 'DS-BINANCE-BTC-OHLCV-1m',
    symbolId: 'SY-BINANCE-BTC-USDT',
    marketDataType: 'OHLCV',
    timeframe: '1m',
    startAt: '2019-09-08T00:00:00.000Z',
    endAt: '2026-08-02T00:00:00.000Z',
    points: '3.5B',
  },
  {
    datasetId: 'DS-DERIBIT-BTC-FUNDING',
    symbolId: 'SY-DERIBIT-BTC-PERP',
    marketDataType: 'FUNDING_RATES',
    timeframe: '1h',
    startAt: '2020-01-01T00:00:00.000Z',
    endAt: '2026-08-02T00:00:00.000Z',
    points: '58M',
  },
  {
    datasetId: 'DS-NASDAQ-AAPL-OHLCV-1d',
    symbolId: 'SY-NASDAQ-AAPL',
    marketDataType: 'OHLCV',
    timeframe: '1d',
    startAt: '1990-01-01T00:00:00.000Z',
    endAt: '2026-08-01T00:00:00.000Z',
    points: '9.1K',
  },
  {
    datasetId: 'DS-DERIBIT-BTC-OPTIONS',
    symbolId: 'SY-DERIBIT-BTC-OPT',
    marketDataType: 'OPTIONS',
    timeframe: '1h',
    startAt: '2021-01-01T00:00:00.000Z',
    endAt: '2026-08-01T00:00:00.000Z',
    points: '820M',
  },
];

const MARKET_EVENTS: readonly MarketEvent[] = [
  {
    id: 'ME-1',
    exchangeId: 'EX-NASDAQ',
    type: 'HOLIDAY',
    label: 'Independence Day',
    date: '2026-07-03',
  },
  {
    id: 'ME-2',
    exchangeId: 'EX-NASDAQ',
    type: 'HALF_DAY',
    label: 'Day after Thanksgiving',
    date: '2026-11-27',
  },
  {
    id: 'ME-3',
    exchangeId: 'EX-CME',
    type: 'MAINTENANCE',
    label: 'Weekly maintenance',
    date: '2026-08-03',
  },
  {
    id: 'ME-4',
    exchangeId: 'EX-BINANCE',
    type: 'HALT',
    label: 'Spot matching upgrade',
    date: '2026-08-05',
  },
];

const SESSIONS: readonly TradingSession[] = [
  {
    id: 'TS-BINANCE',
    exchangeId: 'EX-BINANCE',
    name: 'Continuous',
    open: '00:00',
    close: '24:00',
    timezone: 'UTC',
    state: 'OPEN',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  {
    id: 'TS-NASDAQ-REG',
    exchangeId: 'EX-NASDAQ',
    name: 'Regular',
    open: '09:30',
    close: '16:00',
    timezone: 'America/New_York',
    state: 'CLOSED',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  },
  {
    id: 'TS-NASDAQ-PRE',
    exchangeId: 'EX-NASDAQ',
    name: 'Pre-market',
    open: '04:00',
    close: '09:30',
    timezone: 'America/New_York',
    state: 'PRE_MARKET',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  },
  {
    id: 'TS-CME-ES',
    exchangeId: 'EX-CME',
    name: 'Globex',
    open: '17:00',
    close: '16:00',
    timezone: 'America/Chicago',
    state: 'OPEN',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  },
];

const HOLIDAY_CALENDARS: readonly HolidayCalendar[] = [
  {
    id: 'HC-NASDAQ-2026',
    exchangeId: 'EX-NASDAQ',
    name: 'Nasdaq 2026',
    holidays: [
      { date: '2026-01-01', name: "New Year's Day" },
      { date: '2026-07-03', name: 'Independence Day (observed)' },
      { date: '2026-12-25', name: 'Christmas Day' },
    ],
  },
  {
    id: 'HC-CME-2026',
    exchangeId: 'EX-CME',
    name: 'CME 2026',
    holidays: [
      { date: '2026-01-01', name: "New Year's Day" },
      { date: '2026-12-25', name: 'Christmas Day' },
    ],
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockMarketDataRepository implements MarketDataRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listAssets(): Promise<readonly Asset[]> {
    await this.delay();
    return ASSETS;
  }

  async listExchanges(): Promise<readonly Exchange[]> {
    await this.delay();
    return EXCHANGES;
  }

  async listSymbols(query: SymbolQuery): Promise<readonly SymbolRecord[]> {
    await this.delay();
    return applySymbolQuery(SYMBOLS, query);
  }

  async getSymbol(id: string): Promise<SymbolRecord | null> {
    await this.delay();
    return SYMBOLS.find((symbol) => symbol.id === id) ?? null;
  }

  async listDatasets(query: DatasetQuery): Promise<readonly Dataset[]> {
    await this.delay();
    return applyDatasetQuery(DATASETS, query);
  }

  async getDataset(id: string): Promise<Dataset | null> {
    await this.delay();
    return DATASETS.find((dataset) => dataset.id === id) ?? null;
  }

  async listTimeSeries(datasetId: string): Promise<readonly TimeSeriesRef[]> {
    await this.delay();
    return TIME_SERIES.filter((series) => series.datasetId === datasetId);
  }

  async listSymbolTimeSeries(symbolId: string): Promise<readonly TimeSeriesRef[]> {
    await this.delay();
    return TIME_SERIES.filter((series) => series.symbolId === symbolId);
  }

  async listMarketEvents(): Promise<readonly MarketEvent[]> {
    await this.delay();
    return MARKET_EVENTS;
  }

  async listHolidayCalendars(): Promise<readonly HolidayCalendar[]> {
    await this.delay();
    return HOLIDAY_CALENDARS;
  }

  async listSessions(): Promise<readonly TradingSession[]> {
    await this.delay();
    return SESSIONS;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const MARKET_DATA_SEED = {
  assets: ASSETS,
  exchanges: EXCHANGES,
  symbols: SYMBOLS,
  datasets: DATASETS,
  timeSeries: TIME_SERIES,
  events: MARKET_EVENTS,
  sessions: SESSIONS,
  holidayCalendars: HOLIDAY_CALENDARS,
} as const;
