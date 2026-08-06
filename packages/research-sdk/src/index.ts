/**
 * @platform/research-sdk — typed client for the governed Research API plus the
 * shared Research Engine vocabulary (Phase 6.4).
 *
 * Read/propose transport only. It never validates significance, never accesses
 * OOS/holdout data, and never makes a research decision (AI-2, AI-5, LLM-2). The
 * Research Engine vocabulary re-exported below is the single source of truth for
 * the research lifecycle, capabilities, statuses and canonical objects, shared by
 * the research service and its researcher-facing UI. No quantitative algorithms,
 * no statistics.
 */
import type { ApiClient } from '@platform/api-client';
import type { Id, Iso8601, Page } from '@platform/types';

export * from './lifecycle';
export * from './statuses';
export * from './capabilities';
export * from './contracts';

export interface ExperimentSummary {
  readonly id: Id;
  readonly hypothesis: string;
  readonly status: string;
  readonly registeredAt: Iso8601;
}

export class ResearchSdk {
  constructor(private readonly client: ApiClient) {}

  listExperiments(): Promise<Page<ExperimentSummary>> {
    return this.client.list<ExperimentSummary>('/experiments');
  }

  getExperiment(id: Id): Promise<ExperimentSummary> {
    return this.client.get<ExperimentSummary>(`/experiments/${id}`);
  }
}
