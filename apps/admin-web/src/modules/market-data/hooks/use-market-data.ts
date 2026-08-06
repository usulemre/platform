'use client';

import { useQuery } from '@tanstack/react-query';
import { marketDataService } from '../application/container';
import type { DatasetQuery, SymbolQuery } from '../domain/query';

/** Server-state hooks for the market-data admin UI. They call the application
 *  service only — never a repository, the service tier, a provider, or storage. */
export function useMarketDataSummary() {
  return useQuery({
    queryKey: ['market-data', 'summary'],
    queryFn: () => marketDataService.getSummary(),
  });
}

export function useAssets() {
  return useQuery({
    queryKey: ['market-data', 'assets'],
    queryFn: () => marketDataService.listAssets(),
  });
}

export function useExchanges() {
  return useQuery({
    queryKey: ['market-data', 'exchanges'],
    queryFn: () => marketDataService.listExchanges(),
  });
}

export function useSymbols(query: SymbolQuery) {
  return useQuery({
    queryKey: ['market-data', 'symbols', query],
    queryFn: () => marketDataService.listSymbols(query),
  });
}

export function useSymbol(id: string) {
  return useQuery({
    queryKey: ['market-data', 'symbol', id],
    queryFn: () => marketDataService.getSymbol(id),
    enabled: id.length > 0,
  });
}

export function useDatasets(query: DatasetQuery) {
  return useQuery({
    queryKey: ['market-data', 'datasets', query],
    queryFn: () => marketDataService.listDatasets(query),
  });
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: ['market-data', 'dataset', id],
    queryFn: () => marketDataService.getDataset(id),
    enabled: id.length > 0,
  });
}

export function useDataCoverage() {
  return useQuery({
    queryKey: ['market-data', 'coverage'],
    queryFn: () => marketDataService.getDataCoverage(),
  });
}

export function useDataQualityOverview() {
  return useQuery({
    queryKey: ['market-data', 'quality'],
    queryFn: () => marketDataService.getDataQualityOverview(),
  });
}

export function useCatalog() {
  return useQuery({
    queryKey: ['market-data', 'catalog'],
    queryFn: () => marketDataService.getCatalog(),
  });
}

export function useCalendar() {
  return useQuery({
    queryKey: ['market-data', 'calendar'],
    queryFn: () => marketDataService.getCalendar(),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ['market-data', 'sessions'],
    queryFn: () => marketDataService.getSessions(),
  });
}
