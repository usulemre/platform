/**
 * Composition root for the portfolio-construction service. The single place concrete
 * adapters are bound. In v1 only the in-memory mocks are wired; swapping in real
 * infrastructure adapters (Market Data Platform, Optimizer, Risk module, Validation
 * Foundation, Workflow Engine, Event & Messaging Foundation, Configuration
 * Foundation, read stores) requires no application/domain change.
 */
import { PortfolioConstructionService } from './application/portfolio-construction-service';
import {
  InMemoryEventBus,
  StaticConfiguration,
  StubMarketData,
  StubOptimizer,
  StubRisk,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
import {
  InMemoryComparisonQuery,
  InMemoryFamilyQuery,
  InMemoryPortfolioQuery,
  InMemoryTemplateQuery,
} from './infrastructure/in-memory/repositories';

export function createPortfolioConstructionService(): PortfolioConstructionService {
  return new PortfolioConstructionService({
    portfolios: new InMemoryPortfolioQuery(),
    families: new InMemoryFamilyQuery(),
    comparisons: new InMemoryComparisonQuery(),
    templates: new InMemoryTemplateQuery(),
    marketData: new StubMarketData(),
    optimizer: new StubOptimizer(),
    risk: new StubRisk(),
    validation: new StubValidation(),
    workflow: new StubWorkflow(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'portfolio.default-allocation-model': 'signal-weighted' }),
  });
}

export const portfolioConstructionService = createPortfolioConstructionService();
