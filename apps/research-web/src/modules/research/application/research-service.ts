/**
 * Research admin application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository and maps canonical DTOs to view models. No
 * infrastructure, no quantitative algorithms, no statistics, no persistence.
 * Aggregation is pure.
 */
import { toDetailVm, toListItemVm, toSummaryVm, toTemplateVm } from '../domain/mappers';
import type { ProjectQuery } from '../domain/query';
import type {
  ProjectDetailVm,
  ProjectListItemVm,
  ResearchSummaryVm,
  TemplateVm,
  WorkspaceLinkVm,
} from '../domain/view-model';
import type { ResearchRepository } from '../data/repository';

export class ResearchAdminService {
  constructor(private readonly repository: ResearchRepository) {}

  async listProjects(query: ProjectQuery = {}): Promise<ProjectListItemVm[]> {
    return (await this.repository.listProjects(query)).map(toListItemVm);
  }

  async getProject(id: string): Promise<ProjectDetailVm | null> {
    const project = await this.repository.getProject(id);
    return project ? toDetailVm(project) : null;
  }

  async getSummary(): Promise<ResearchSummaryVm> {
    return toSummaryVm(await this.repository.listProjects({}));
  }

  async listTemplates(): Promise<TemplateVm[]> {
    return (await this.repository.listTemplates()).map(toTemplateVm);
  }

  async getWorkspaceLink(): Promise<WorkspaceLinkVm> {
    const link = await this.repository.getWorkspaceLink();
    return { href: link.href, pinnedProjects: link.pinnedProjects };
  }
}
