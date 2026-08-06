/**
 * Composition root for the Backtesting Engine UI module. The single place a
 * concrete repository is bound. Replace MockBacktestingRepository with
 * `new ApiBacktestingRepository(apiClient)` (over the backtesting service gateway)
 * to go live — no UI/hook/service changes.
 */
import { MockBacktestingRepository } from '../data/mock-repository';
import { BacktestingAdminService } from './backtesting-service';

export const backtestingAdminService = new BacktestingAdminService(new MockBacktestingRepository());
