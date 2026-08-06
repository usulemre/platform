/**
 * Composition root for the Risk Engine UI module (admin-web). The single place a
 * concrete repository is bound. Replace MockRiskEngineRepository with
 * `new ApiRiskEngineRepository(apiClient)` (over the risk-engine service gateway) to go
 * live — no UI/hook/service changes.
 */
import { MockRiskEngineRepository } from '../data/mock-repository';
import { RiskEngineAdminService } from './risk-engine-service';

export const riskEngineAdminService = new RiskEngineAdminService(new MockRiskEngineRepository());
