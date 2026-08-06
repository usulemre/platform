/**
 * Composition root for the Strategy Module. The single place a concrete
 * repository is bound. Replace MockStrategyRepository with
 * `new ApiStrategyRepository(apiClient)` to go live — no UI/hook/service changes.
 */
import { MockStrategyRepository } from '../data/mock-repository';
import { StrategyService } from './strategy-service';

export const strategyService = new StrategyService(new MockStrategyRepository());
