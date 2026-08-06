/**
 * In-memory read-model adapters. Development/test only — no persistence, no cache, no
 * database. They implement the query ports over the synthetic seed.
 */
import type {
  PerformanceReport,
  ReportFamily,
  PerformanceComparison,
  Benchmark,
} from '@platform/performance-sdk';
import type {
  BenchmarkQueryPort,
  ComparisonQueryPort,
  FamilyQueryPort,
  ReportQueryPort,
} from '../ports';
import { BENCHMARKS, COMPARISONS, FAMILIES, REPORTS } from './seed';

export class InMemoryReportQuery implements ReportQueryPort {
  constructor(private readonly data: readonly PerformanceReport[] = REPORTS) {}
  async list(): Promise<readonly PerformanceReport[]> {
    return this.data;
  }
  async getById(id: string): Promise<PerformanceReport | null> {
    return this.data.find((report) => report.id === id) ?? null;
  }
}

export class InMemoryFamilyQuery implements FamilyQueryPort {
  constructor(private readonly data: readonly ReportFamily[] = FAMILIES) {}
  async list(): Promise<readonly ReportFamily[]> {
    return this.data;
  }
}

export class InMemoryComparisonQuery implements ComparisonQueryPort {
  constructor(private readonly data: readonly PerformanceComparison[] = COMPARISONS) {}
  async list(): Promise<readonly PerformanceComparison[]> {
    return this.data;
  }
  async getById(id: string): Promise<PerformanceComparison | null> {
    return this.data.find((comparison) => comparison.id === id) ?? null;
  }
}

export class InMemoryBenchmarkQuery implements BenchmarkQueryPort {
  constructor(private readonly data: readonly Benchmark[] = BENCHMARKS) {}
  async list(): Promise<readonly Benchmark[]> {
    return this.data;
  }
}
