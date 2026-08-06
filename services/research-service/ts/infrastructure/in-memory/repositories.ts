/**
 * In-memory read-model adapters. Development/test only — no persistence, no
 * external calls. They implement the query ports over the synthetic seed.
 */
import type { ResearchProject, ResearchTemplate } from '@platform/research-sdk';
import type { ProjectQueryPort, TemplateQueryPort } from '../ports';
import { PROJECTS, TEMPLATES } from './seed';

export class InMemoryProjectQuery implements ProjectQueryPort {
  constructor(private readonly data: readonly ResearchProject[] = PROJECTS) {}
  async list(): Promise<readonly ResearchProject[]> {
    return this.data;
  }
  async getById(id: string): Promise<ResearchProject | null> {
    return this.data.find((project) => project.id === id) ?? null;
  }
}

export class InMemoryTemplateQuery implements TemplateQueryPort {
  constructor(private readonly data: readonly ResearchTemplate[] = TEMPLATES) {}
  async list(): Promise<readonly ResearchTemplate[]> {
    return this.data;
  }
  async getById(id: string): Promise<ResearchTemplate | null> {
    return this.data.find((template) => template.id === id) ?? null;
  }
}
