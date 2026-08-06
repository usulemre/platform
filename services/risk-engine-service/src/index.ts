/**
 * @services/risk-engine-service — the canonical Risk Engine.
 *
 * The governance and orchestration platform that validates portfolios before
 * execution: it manages the lifecycle of risk assessments (draft → assessment
 * requested → policy validation → exposure review → limit validation → exception review
 * → approval → execution authorized → archived) and coordinates institutional risk
 * reviews, policy enforcement, exposure validation and approval workflows. It
 * integrates with the Portfolio Construction Engine, Backtesting Engine, Signal Engine,
 * Feature Store, Research Engine, Validation Foundation, Workflow Engine, Configuration
 * Foundation, Event & Messaging Foundation, Monitoring Module, Audit Center and
 * Notification Center through infrastructure INTERFACES only.
 *
 * It has a pure domain layer (discovery/search, lifecycle + governance rules,
 * derivations + comparison assembly), an application layer, and infrastructure ports;
 * the only adapters shipped in v1 are in-memory mocks. No risk model, no VaR, no CVaR,
 * no expected shortfall, no stress testing, no exposure calculation, no statistics, no
 * persistence, no caching, no database, no direct infrastructure access.
 */
export * from './domain/discovery';
export * from './domain/lifecycle';
export * from './domain/derivations';

export * from './application/risk-engine-service';

export * from './infrastructure/ports';
export {
  InMemoryAssessmentQuery,
  InMemoryComparisonQuery,
  InMemoryFamilyQuery,
  InMemoryPolicyQuery,
} from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export { ASSESSMENTS, FAMILIES, POLICIES, COMPARISONS } from './infrastructure/in-memory/seed';

export * from './composition';
