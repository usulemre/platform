/**
 * @platform/portfolio-sdk — the shared Portfolio Construction Engine SDK.
 *
 * The single source of truth for the Portfolio Construction Engine *vocabulary*: the
 * portfolio-construction lifecycle stages (draft → signal selection → constraint
 * definition → allocation configuration → optimization request → validation → review
 * → approval → published → archived), the optimization status + control predicates
 * (cancel / retry), the engine capabilities, the metric catalog (descriptors only),
 * the canonical models (Portfolio / PortfolioDefinition, PortfolioVersion,
 * PortfolioAllocation, PortfolioConstraint, PortfolioOptimizationRequest,
 * PortfolioReview, PortfolioApproval, PortfolioMetadata (MetadataEntry),
 * PortfolioLineage, PortfolioDependency, PortfolioSnapshot, PortfolioTemplate,
 * PortfolioUniverse, …), and pure identifier/version primitives. Consumed by both
 * the portfolio-construction service and its UI.
 *
 * It contains NO optimizer, NO mean-variance / Black-Litterman / risk-parity
 * algorithm, NO weight calculation, NO risk computation, NO statistics, NO
 * persistence, NO caching, NO database access, and NO transport.
 */
export * from './stages';
export * from './statuses';
export * from './capabilities';
export * from './metrics';
export * from './contracts';
export * from './identifiers';
