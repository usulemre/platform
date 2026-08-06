/**
 * @platform/workflow-sdk — typed client for the governed workflow endpoints.
 * It only reads/triggers workflows through the API; it orchestrates nothing and
 * adjudicates nothing (WCON-2: workflows orchestrate, they do not decide).
 */
import type { ApiClient } from '@platform/api-client';
import type { Id, Iso8601, Page } from '@platform/types';

export interface WorkflowSummary {
  readonly id: Id;
  readonly name: string;
  readonly status: string;
  readonly updatedAt: Iso8601;
}

export class WorkflowSdk {
  constructor(private readonly client: ApiClient) {}

  list(): Promise<Page<WorkflowSummary>> {
    return this.client.list<WorkflowSummary>('/workflows');
  }

  get(id: Id): Promise<WorkflowSummary> {
    return this.client.get<WorkflowSummary>(`/workflows/${id}`);
  }
}
