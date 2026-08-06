/**
 * @platform/risk-sdk — the shared Risk Engine SDK.
 *
 * The single source of truth for the Risk Engine *vocabulary*: the risk-governance
 * lifecycle stages (draft → assessment requested → policy validation → exposure review
 * → limit validation → exception review → approval → execution authorized → archived),
 * the status vocabularies + pure governance predicates, the engine capabilities, the
 * metric catalog (descriptors only), the canonical models (RiskAssessment, RiskReview,
 * RiskPolicy, RiskRule, RiskLimit, RiskConstraint, RiskExposure, RiskApproval,
 * RiskException, RiskOverride, RiskMetadata (MetadataEntry), RiskSnapshot, RiskReport,
 * RiskAudit, …), and pure identifier/version primitives. Consumed by both the
 * risk-engine service and its UIs.
 *
 * It contains NO VaR, NO CVaR, NO expected shortfall, NO stress testing, NO exposure
 * calculation, NO quantitative risk model, NO statistics, NO persistence, NO caching,
 * NO database access, and NO transport.
 */
export * from './stages';
export * from './statuses';
export * from './capabilities';
export * from './metrics';
export * from './contracts';
export * from './identifiers';
