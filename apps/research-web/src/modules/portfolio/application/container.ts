/**
 * Composition root for the Portfolio Module. The single place a concrete
 * repository is bound. Replace MockPortfolioRepository with
 * `new ApiPortfolioRepository(apiClient)` to go live — no UI/hook/service changes.
 */
import { MockPortfolioRepository } from '../data/mock-repository';
import { PortfolioService } from './portfolio-service';

export const portfolioService = new PortfolioService(new MockPortfolioRepository());
