/**
 * Real adapter over the governed API gateway (execution-simulator service). NOT wired in
 * v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never a broker, never an exchange, never a simulator, never
 * persistence, never FIX, never WebSocket.
 */
import type { ApiClient } from '@platform/api-client';
import type {
  SimulationSession,
  SimulationComparison,
  SimulationFamily,
  ScenarioTemplate,
} from '@platform/execution-sdk';
import type { SessionQuery } from '../domain/query';
import type { ExecutionSimulatorRepository } from './repository';

function buildQueryString(query: SessionQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.namespace && query.namespace !== 'ALL') params.set('namespace', query.namespace);
  if (query.stage && query.stage !== 'ALL') params.set('stage', query.stage);
  if (query.tag) params.set('tag', query.tag);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiExecutionSimulatorRepository implements ExecutionSimulatorRepository {
  constructor(private readonly api: ApiClient) {}

  listSessions(query: SessionQuery): Promise<readonly SimulationSession[]> {
    return this.api.request<readonly SimulationSession[]>(
      `/execution-simulator/sessions${buildQueryString(query)}`,
    );
  }

  async getSession(id: string): Promise<SimulationSession | null> {
    try {
      return await this.api.request<SimulationSession>(`/execution-simulator/sessions/${id}`);
    } catch {
      return null;
    }
  }

  listFamilies(): Promise<readonly SimulationFamily[]> {
    return this.api.request<readonly SimulationFamily[]>('/execution-simulator/families');
  }

  listTemplates(): Promise<readonly ScenarioTemplate[]> {
    return this.api.request<readonly ScenarioTemplate[]>('/execution-simulator/templates');
  }

  executionQueue(): Promise<readonly SimulationSession[]> {
    return this.api.request<readonly SimulationSession[]>('/execution-simulator/queues/execution');
  }

  reviewQueue(): Promise<readonly SimulationSession[]> {
    return this.api.request<readonly SimulationSession[]>('/execution-simulator/queues/review');
  }

  approvalQueue(): Promise<readonly SimulationSession[]> {
    return this.api.request<readonly SimulationSession[]>('/execution-simulator/queues/approval');
  }

  history(): Promise<readonly SimulationSession[]> {
    return this.api.request<readonly SimulationSession[]>('/execution-simulator/history');
  }

  listComparisons(): Promise<readonly SimulationComparison[]> {
    return this.api.request<readonly SimulationComparison[]>('/execution-simulator/comparisons');
  }

  async getComparison(id: string): Promise<SimulationComparison | null> {
    try {
      return await this.api.request<SimulationComparison>(`/execution-simulator/comparisons/${id}`);
    } catch {
      return null;
    }
  }
}
