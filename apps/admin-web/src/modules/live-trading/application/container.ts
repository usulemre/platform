/**
 * Composition root for the Live Trading Platform UI module (research-web). The single
 * place a concrete repository is bound. Replace MockLiveTradingRepository with
 * `new ApiLiveTradingRepository(apiClient)` (over the live-trading service gateway) to go
 * live — no UI/hook/service changes.
 */
import { MockLiveTradingRepository } from '../data/mock-repository';
import { LiveTradingAdminService } from './live-trading-service';

export const liveTradingAdminService = new LiveTradingAdminService(new MockLiveTradingRepository());
