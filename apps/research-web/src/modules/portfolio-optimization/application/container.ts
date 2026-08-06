/**
 * Composition root for the Portfolio Optimization UI module. Binds the mock repository (which runs
 * the REAL SDK optimizers over synthetic universes). Swap in an API-backed repository over the
 * portfolio-optimization service gateway to optimize live universes — no UI/hook change.
 */
import { MockPortfolioOptimizationRepository } from '../data/mock-repository';
import { PortfolioOptimizationAdminService } from './portfolio-optimization-service';

export const portfolioOptimizationAdminService = new PortfolioOptimizationAdminService(
  new MockPortfolioOptimizationRepository(),
);
