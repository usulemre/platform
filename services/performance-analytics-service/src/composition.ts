/**
 * Composition root for the performance-analytics service. The single place concrete adapters
 * are bound. In v1 only the in-memory mocks are wired; swapping in real infrastructure
 * adapters (Analytics Runtime, Validation Foundation, Workflow Engine, Event & Messaging
 * Foundation, Configuration Foundation, read stores) requires no application/domain change.
 */
import { PerformanceAnalyticsService } from './application/performance-analytics-service';
import {
  InMemoryEventBus,
  StaticConfiguration,
  StubAnalyticsRuntime,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
import {
  InMemoryBenchmarkQuery,
  InMemoryComparisonQuery,
  InMemoryFamilyQuery,
  InMemoryReportQuery,
} from './infrastructure/in-memory/repositories';

export function createPerformanceAnalyticsService(): PerformanceAnalyticsService {
  return new PerformanceAnalyticsService({
    reports: new InMemoryReportQuery(),
    families: new InMemoryFamilyQuery(),
    comparisons: new InMemoryComparisonQuery(),
    benchmarks: new InMemoryBenchmarkQuery(),
    runtime: new StubAnalyticsRuntime(),
    validation: new StubValidation(),
    workflow: new StubWorkflow(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'analytics.catalog-version': '1.0.0' }),
  });
}

export const performanceAnalyticsService = createPerformanceAnalyticsService();
