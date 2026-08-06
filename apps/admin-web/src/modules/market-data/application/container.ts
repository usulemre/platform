/**
 * Composition root for the market-data admin module. The single place a concrete
 * repository is bound. Replace MockMarketDataRepository with
 * `new ApiMarketDataRepository(apiClient)` (over the market-data service gateway)
 * to go live — no UI/hook/service changes.
 */
import { MockMarketDataRepository } from '../data/mock-repository';
import { MarketDataService } from './market-data-service';

export const marketDataService = new MarketDataService(new MockMarketDataRepository());
