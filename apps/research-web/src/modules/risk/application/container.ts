/**
 * Composition root for the Risk Module. The single place a concrete repository is
 * bound. Replace MockRiskRepository with `new ApiRiskRepository(apiClient)` to go
 * live — no UI/hook/service changes.
 */
import { MockRiskRepository } from '../data/mock-repository';
import { RiskService } from './risk-service';

export const riskService = new RiskService(new MockRiskRepository());
