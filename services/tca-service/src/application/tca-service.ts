/**
 * TCA application service — the orchestration surface of the canonical Transaction Cost Analysis
 * engine. It reads post-trade execution records and produces REAL, deterministic execution-quality
 * analytics via `@platform/tca-sdk`: per-execution analytics, benchmark comparison, cost breakdown,
 * attribution, implementation shortfall, quality scoring, the per-venue comparison, cost reports and
 * scorecards, and the service-level metrics. It integrates with the Execution Engine, Smart Order
 * Router, Order Management System, Live Trading Platform, Market Data Platform, Performance Analytics
 * Engine, Risk Analytics Engine, Monitoring Module, Configuration Foundation, Validation Foundation
 * and Workflow Engine through ports ONLY.
 *
 * It holds no exchange/broker SDK, no API keys, no HTTP/WebSocket/FIX and no connectivity. Analysis
 * is post-trade; the service never contacts a venue. Given identical inputs it is reproducible.
 */
import {
  BENCHMARK_CATALOG,
  TCA_METRIC_CATALOG,
  aggregate,
  analyzeExecution,
  compareVenues,
  type AggregateAnalytics,
  type BenchmarkDescriptor,
  type ExecutionAnalytics,
  type ExecutionInput,
  type TcaMetricDescriptor,
  type VenueComparison,
} from '@platform/tca-sdk';
import { buildCostReport, type CostReport, type ReportGroupBy } from '../domain/reports';
import {
  buildScorecards,
  type ExecutionScorecard,
  type ScorecardDimension,
} from '../domain/scorecards';
import { computeTcaMetrics, type TcaMetrics } from '../domain/metrics';
import { applyExecutionSearch, type ExecutionQuery } from '../domain/search';
import type {
  AuditPort,
  ConfigurationPort,
  EventBusPort,
  ExecutionStorePort,
  MarketDataPort,
  NotificationPort,
  ValidationPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface TcaServiceDeps {
  readonly store: ExecutionStorePort;
  readonly marketData: MarketDataPort;
  readonly validation: ValidationPort;
  readonly workflow: WorkflowPort;
  readonly audit: AuditPort;
  readonly notifications: NotificationPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class TcaService {
  constructor(private readonly deps: TcaServiceDeps) {}

  /* ------------------------------ read models ------------------------------ */

  listExecutions(query: ExecutionQuery = {}): Promise<readonly ExecutionInput[]> {
    return this.deps.store.list().then((executions) => applyExecutionSearch(executions, query));
  }
  getExecution(id: string): Promise<ExecutionInput | null> {
    return this.deps.store.getById(id);
  }

  /** Analyze a single stored execution end-to-end (null if unknown). */
  async analyze(id: string): Promise<ExecutionAnalytics | null> {
    const execution = await this.deps.store.getById(id);
    return execution ? analyzeExecution(execution) : null;
  }

  /** Analyze every stored execution (deterministic order by execution time). */
  async analyzeAll(): Promise<readonly ExecutionAnalytics[]> {
    const executions = applyExecutionSearch(await this.deps.store.list(), {
      sortBy: 'executedAt',
      sortDir: 'asc',
    });
    return executions.map(analyzeExecution);
  }

  /** Analyze a filtered set of executions. */
  async analyzeQuery(query: ExecutionQuery): Promise<readonly ExecutionAnalytics[]> {
    return (await this.listExecutions(query)).map(analyzeExecution);
  }

  /* ------------------------------ aggregates ------------------------------- */

  async metrics(): Promise<TcaMetrics> {
    return computeTcaMetrics(await this.analyzeAll());
  }
  async aggregate(): Promise<AggregateAnalytics> {
    return aggregate(await this.analyzeAll());
  }
  async venueComparison(): Promise<readonly VenueComparison[]> {
    return compareVenues(await this.analyzeAll());
  }
  async costReport(groupBy: ReportGroupBy, generatedAt: string): Promise<CostReport> {
    return buildCostReport(await this.analyzeAll(), groupBy, generatedAt);
  }
  async scorecards(dimension: ScorecardDimension): Promise<readonly ExecutionScorecard[]> {
    return buildScorecards(await this.analyzeAll(), dimension);
  }

  listBenchmarks(): readonly BenchmarkDescriptor[] {
    return BENCHMARK_CATALOG;
  }
  listMetricDefinitions(): readonly TcaMetricDescriptor[] {
    return TCA_METRIC_CATALOG;
  }

  /* ------------------------------ ingestion -------------------------------- */

  /** Ingest a post-trade execution record: validate → persist → analyze → schedule → publish. */
  async ingestExecution(
    execution: ExecutionInput,
    actor: string,
    at: string,
  ): Promise<ExecutionAnalytics | null> {
    if (!(await this.deps.validation.isValid(execution.id))) {
      await this.deps.notifications.notify({
        executionId: execution.id,
        channel: 'trading-ops',
        summary: `Execution ${execution.id} failed post-trade validation.`,
      });
      return null;
    }
    await this.deps.store.save(execution);
    const analytics = analyzeExecution(execution);
    await this.deps.workflow.scheduleAnalysis(execution.id);
    await this.deps.audit.record({ executionId: execution.id, actor, action: 'TCA_ANALYZED', at });
    await this.deps.bus.publish({
      id: `${execution.id}:TCA_ANALYZED:${at}`,
      executionId: execution.id,
      type: 'TCA_ANALYZED',
      message: `${execution.symbol} analyzed: ${analytics.cost.totalBps.toFixed(2)} bps (grade ${analytics.quality.grade}).`,
      occurredAt: at,
    });
    const threshold = Number(this.deps.config.get('tca.alert-total-bps') ?? '50');
    if (analytics.cost.totalBps > threshold) {
      await this.deps.notifications.notify({
        executionId: execution.id,
        channel: 'trading-ops',
        summary: `High execution cost on ${execution.symbol}: ${analytics.cost.totalBps.toFixed(1)} bps.`,
      });
    }
    return analytics;
  }
}
