/**
 * @services/portfolio-construction-service — the canonical Portfolio Construction
 * Engine.
 *
 * The orchestration platform that transforms approved trading signals into governed
 * investment portfolios: it manages the lifecycle of portfolio definitions (draft →
 * signal selection → constraint definition → allocation configuration → optimization
 * request → validation → review → approval → published → archived) and coordinates
 * construction workflows over approved signals, strategies, features, datasets and
 * backtests. It integrates with the Research Engine, Feature Store, Signal Engine,
 * Backtesting Engine, Portfolio module, Risk module, Validation Foundation, Workflow
 * Engine, Configuration Foundation, Event & Messaging Foundation and Market Data
 * Platform through infrastructure INTERFACES only.
 *
 * It has a pure domain layer (discovery/search, lifecycle + optimization-control
 * rules, derivations + comparison assembly), an application layer, and infrastructure
 * ports; the only adapters shipped in v1 are in-memory mocks. No optimizer, no
 * mean-variance / Black-Litterman / risk-parity algorithm, no weight calculation, no
 * risk computation, no statistics, no persistence, no caching, no database, no direct
 * infrastructure access.
 */
export * from './domain/discovery';
export * from './domain/lifecycle';
export * from './domain/derivations';

export * from './application/portfolio-construction-service';

export * from './infrastructure/ports';
export {
  InMemoryComparisonQuery,
  InMemoryFamilyQuery,
  InMemoryPortfolioQuery,
  InMemoryTemplateQuery,
} from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export { PORTFOLIOS, FAMILIES, TEMPLATES, COMPARISONS } from './infrastructure/in-memory/seed';

export * from './composition';
