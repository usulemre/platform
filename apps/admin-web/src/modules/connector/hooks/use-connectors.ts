'use client';

import { useQuery } from '@tanstack/react-query';
import { connectorService } from '../application/container';
import type { ConnectorQuery } from '../domain/query';

/** Server-state hooks for connectors. They call the application service only —
 *  never a repository, transport, or provider directly. */
export function useConnectors(query: ConnectorQuery) {
  return useQuery({
    queryKey: ['connectors', 'list', query],
    queryFn: () => connectorService.listConnectors(query),
  });
}

export function useConnector(id: string) {
  return useQuery({
    queryKey: ['connectors', 'detail', id],
    queryFn: () => connectorService.getConnector(id),
    enabled: id.length > 0,
  });
}

export function useConnectorSummary() {
  return useQuery({
    queryKey: ['connectors', 'summary'],
    queryFn: () => connectorService.getSummary(),
  });
}
