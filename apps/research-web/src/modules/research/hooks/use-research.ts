'use client';

import { useQuery } from '@tanstack/react-query';
import { researchAdminService } from '../application/container';
import type { ProjectQuery } from '../domain/query';

/** Server-state hooks for the Research Engine UI. They call the application
 *  service only — never a repository, the service tier, a broker, or persistence. */
export function useResearchSummary() {
  return useQuery({
    queryKey: ['research', 'summary'],
    queryFn: () => researchAdminService.getSummary(),
  });
}

export function useProjects(query: ProjectQuery) {
  return useQuery({
    queryKey: ['research', 'projects', query],
    queryFn: () => researchAdminService.listProjects(query),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['research', 'project', id],
    queryFn: () => researchAdminService.getProject(id),
    enabled: id.length > 0,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ['research', 'templates'],
    queryFn: () => researchAdminService.listTemplates(),
  });
}

export function useWorkspaceLink() {
  return useQuery({
    queryKey: ['research', 'workspace'],
    queryFn: () => researchAdminService.getWorkspaceLink(),
  });
}
