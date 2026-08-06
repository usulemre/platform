/**
 * @services/tca-service — the canonical Transaction Cost Analysis (TCA) Engine.
 *
 * The execution-quality analytics platform that evaluates executed trades against market benchmarks
 * and execution objectives. It implements REAL, deterministic post-trade cost analytics (the
 * `@platform/tca-sdk` calculation library): per-execution analytics, eight-benchmark comparison,
 * effective/realized spread, the permanent/temporary market-impact decomposition, Perold
 * implementation shortfall, the additive cost breakdown and attribution, execution efficiency and a
 * 0–100 quality score, plus the notional-weighted per-venue comparison, cost reports, execution
 * scorecards and service-level metrics. It integrates with the Execution Engine, Smart Order Router,
 * Order Management System, Live Trading Platform, Market Data Platform, Performance Analytics Engine,
 * Risk Analytics Engine, Monitoring Module, Configuration Foundation, Validation Foundation and
 * Workflow Engine through infrastructure INTERFACES only.
 *
 * It is broker-independent: NO exchange SDK, NO broker SDK, NO FIX, NO REST/WebSocket transport, NO
 * connectivity and NO persistence beyond in-memory v1 adapters. Analysis is post-trade; the service
 * never contacts a venue.
 */
export * from './domain/reports';
export * from './domain/scorecards';
export * from './domain/metrics';
export * from './domain/search';

export * from './application/tca-service';

export * from './infrastructure/ports';
export {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryExecutionStore,
  InMemoryNotifications,
  StaticConfiguration,
  StubMarketData,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
export { EXECUTIONS } from './infrastructure/in-memory/seed';

export * from './composition';
