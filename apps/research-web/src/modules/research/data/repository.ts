/**
 * Research admin repository boundary — the ONLY data abstraction the application
 * service depends on. Concrete adapters implement it; the UI never sees a concrete
 * data source and never touches the service tier, a broker, or persistence.
 */
import type { ResearchProject, ResearchTemplate } from '@platform/research-sdk';
import type { ProjectQuery } from '../domain/query';

export type { ProjectQuery };

export interface WorkspaceLink {
  readonly href: string;
  readonly pinnedProjects: number;
}

export interface ResearchRepository {
  listProjects(query: ProjectQuery): Promise<readonly ResearchProject[]>;
  getProject(id: string): Promise<ResearchProject | null>;
  listTemplates(): Promise<readonly ResearchTemplate[]>;
  getWorkspaceLink(): Promise<WorkspaceLink>;
}
