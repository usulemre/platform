/**
 * @platform/execution-sdk — the shared Execution Simulator SDK.
 *
 * The single source of truth for the Execution Simulator *vocabulary*: the simulation
 * lifecycle stages (draft → scenario configuration → validation → queued → running →
 * completed → review → approved → archived), the run status + run-control predicates
 * (pause / resume / retry / cancel / replay), the canonical order states (created →
 * validated → queued → submitted → partially filled → filled / cancelled / rejected /
 * expired), the engine capabilities, the metric catalog (descriptors only), the
 * canonical models (SimulationSession, SimulationScenario, ExecutionOrder,
 * ExecutionFill, ExecutionPosition, ExecutionPortfolio, ExecutionTimelineEvent,
 * ExecutionReplay, ExecutionReview, ExecutionApproval, ExecutionReport,
 * ExecutionArtifact, ExecutionSnapshot, …), and pure identifier/version primitives.
 * Consumed by both the execution-simulator service and its UIs.
 *
 * It contains NO execution algorithm, NO exchange connectivity, NO broker SDK, NO FIX,
 * NO WebSocket, NO fill/price/PnL computation, NO statistics, NO persistence, NO
 * caching, NO database access, and NO transport.
 */
export * from './stages';
export * from './statuses';
export * from './capabilities';
export * from './metrics';
export * from './contracts';
export * from './identifiers';
