'use client';

import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '../application/container';
import type { WorkspaceItemKindDto } from '../domain/dto';

/** Server-state hooks for the Research Workspace. They call the application
 *  service only — never a repository or transport directly. */
export function useWorkspaceSummary() {
  return useQuery({
    queryKey: ['workspace', 'summary'],
    queryFn: () => workspaceService.getSummary(),
  });
}

export function useRecent(kind: WorkspaceItemKindDto) {
  return useQuery({
    queryKey: ['workspace', 'recent', kind],
    queryFn: () => workspaceService.getRecent(kind),
  });
}

export function useActiveExperiments() {
  return useQuery({
    queryKey: ['workspace', 'active-experiments'],
    queryFn: () => workspaceService.getActiveExperiments(),
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ['workspace', 'favorites'],
    queryFn: () => workspaceService.getFavorites(),
  });
}

export function useBookmarks() {
  return useQuery({
    queryKey: ['workspace', 'bookmarks'],
    queryFn: () => workspaceService.getBookmarks(),
  });
}

export function useActivity() {
  return useQuery({
    queryKey: ['workspace', 'activity'],
    queryFn: () => workspaceService.getActivity(),
  });
}

export function useSavedViews() {
  return useQuery({
    queryKey: ['workspace', 'saved-views'],
    queryFn: () => workspaceService.getSavedViews(),
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: ['workspace', 'preferences'],
    queryFn: () => workspaceService.getPreferences(),
  });
}

export function useWorkspaceNotifications() {
  return useQuery({
    queryKey: ['workspace', 'notifications'],
    queryFn: () => workspaceService.getNotifications(),
  });
}

export function useQuickActions() {
  return useQuery({
    queryKey: ['workspace', 'quick-actions'],
    queryFn: () => workspaceService.getQuickActions(),
  });
}
