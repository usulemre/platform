/**
 * Composition root for the market-data service. The single place concrete
 * adapters are bound. In v1 only the in-memory mocks are wired; swapping in real
 * infrastructure adapters (ingestion source, Validation Foundation, Workflow
 * Engine, Configuration Foundation, read stores) requires no application/domain
 * change.
 */
import { MarketDataService } from './application/market-data-service';
import {
  StaticConfiguration,
  StubIngestionDatasetSource,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
import {
  InMemoryAssetQuery,
  InMemoryCalendarQuery,
  InMemoryDatasetQuery,
  InMemoryExchangeQuery,
  InMemorySessionQuery,
  InMemorySymbolQuery,
  InMemoryTimeSeriesQuery,
} from './infrastructure/in-memory/repositories';

export function createMarketDataService(): MarketDataService {
  return new MarketDataService({
    assets: new InMemoryAssetQuery(),
    exchanges: new InMemoryExchangeQuery(),
    symbols: new InMemorySymbolQuery(),
    datasets: new InMemoryDatasetQuery(),
    timeSeries: new InMemoryTimeSeriesQuery(),
    calendars: new InMemoryCalendarQuery(),
    sessions: new InMemorySessionQuery(),
    ingestion: new StubIngestionDatasetSource(),
    workflow: new StubWorkflow(),
  });
}

/** Validation Foundation stub (dataset catalogued check). */
export const validation = new StubValidation();

/** Configuration Foundation stub (non-secret keys only). */
export const configuration = new StaticConfiguration({ 'market-data.default-timezone': 'UTC' });

export const marketDataService = createMarketDataService();
