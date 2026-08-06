/**
 * Real adapter over the governed API gateway (research service). NOT wired in v1.
 * Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never a broker, never persistence.
 */
import type { ApiClient } from '@platform/api-client';
import type { ResearchProject, ResearchTemplate } from '@platform/research-sdk';
import type { ProjectQuery } from '../domain/query';
import type { ResearchRepository, WorkspaceLink } from './repository';

function buildQueryString(query: ProjectQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiResearchRepository implements ResearchRepository {
  constructor(private readonly api: ApiClient) {}

  listProjects(query: ProjectQuery): Promise<readonly ResearchProject[]> {
    return this.api.request<readonly ResearchProject[]>(
      `/research/projects${buildQueryString(query)}`,
    );
  }

  async getProject(id: string): Promise<ResearchProject | null> {
    try {
      return await this.api.request<ResearchProject>(`/research/projects/${id}`);
    } catch {
      return null;
    }
  }

  listTemplates(): Promise<readonly ResearchTemplate[]> {
    return this.api.request<readonly ResearchTemplate[]>('/research/templates');
  }

  getWorkspaceLink(): Promise<WorkspaceLink> {
    return this.api.request<WorkspaceLink>('/research/workspace');
  }
}
