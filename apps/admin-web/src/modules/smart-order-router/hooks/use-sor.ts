'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { sorAdminService } from '../application/container';
import type { PreviewInput } from '../application/sor-service';
import type { RoutingQuery } from '../domain/query';

/** Server-state hooks for the SOR UI. They call the application service only — never a repository,
 *  the service tier, an exchange, a broker, a credential, or persistence. */
export function useRoutings(query: RoutingQuery = {}) {
  return useQuery({
    queryKey: ['sor', 'list', query],
    queryFn: () => sorAdminService.listRoutings(query),
  });
}
export function useRouting(id: string) {
  return useQuery({
    queryKey: ['sor', 'detail', id],
    queryFn: () => sorAdminService.getRouting(id),
    enabled: id.length > 0,
  });
}
export function useSorSummary() {
  return useQuery({ queryKey: ['sor', 'summary'], queryFn: () => sorAdminService.getSummary() });
}
export function useSorMetrics() {
  return useQuery({ queryKey: ['sor', 'metrics'], queryFn: () => sorAdminService.getMetrics() });
}
export function useSorHealth() {
  return useQuery({ queryKey: ['sor', 'health'], queryFn: () => sorAdminService.getHealth() });
}
export function useSorTimeline() {
  return useQuery({ queryKey: ['sor', 'timeline'], queryFn: () => sorAdminService.getTimeline() });
}
export function useSorAudit() {
  return useQuery({ queryKey: ['sor', 'audit'], queryFn: () => sorAdminService.getAudit() });
}
export function useSorDecisions() {
  return useQuery({
    queryKey: ['sor', 'decisions'],
    queryFn: () => sorAdminService.getDecisions(),
  });
}
export function useSorReplay(id: string) {
  return useQuery({
    queryKey: ['sor', 'replay', id],
    queryFn: () => sorAdminService.getReplay(id),
    enabled: id.length > 0,
  });
}
export function useSorRefs() {
  return useQuery({ queryKey: ['sor', 'refs'], queryFn: () => sorAdminService.listRefs() });
}
export function useVenues() {
  return useQuery({ queryKey: ['sor', 'venues'], queryFn: () => sorAdminService.listVenues() });
}
export function useVenueHealth() {
  return useQuery({
    queryKey: ['sor', 'venue-health'],
    queryFn: () => sorAdminService.listVenueHealth(),
  });
}
export function usePolicies() {
  return useQuery({ queryKey: ['sor', 'policies'], queryFn: () => sorAdminService.listPolicies() });
}
export function useVenueTypes() {
  return useQuery({
    queryKey: ['sor', 'venue-types'],
    queryFn: () => sorAdminService.listVenueTypes(),
  });
}
export function usePreviewRoute() {
  return useMutation({ mutationFn: (input: PreviewInput) => sorAdminService.previewRoute(input) });
}
