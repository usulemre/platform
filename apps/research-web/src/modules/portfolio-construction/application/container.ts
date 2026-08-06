/**
 * Composition root for the Portfolio Construction Engine UI module. The single place a
 * concrete repository is bound. Replace MockPortfolioConstructionRepository with
 * `new ApiPortfolioConstructionRepository(apiClient)` (over the portfolio-construction
 * service gateway) to go live — no UI/hook/service changes.
 */
import { MockPortfolioConstructionRepository } from '../data/mock-repository';
import { PortfolioConstructionAdminService } from './portfolio-construction-service';

export const portfolioConstructionAdminService = new PortfolioConstructionAdminService(
  new MockPortfolioConstructionRepository(),
);
